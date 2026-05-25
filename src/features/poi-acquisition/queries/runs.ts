import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { callGemini } from '@/features/gemini-fetch/services/gemini-client'
import { searchGooglePlaceCandidates, type GooglePlaceCandidate } from '../lib/google-places'
import { geocodeForAcquisition } from '../lib/geocode'
import { findProbableDuplicates } from '../lib/duplicate-detection'
import { PoiAcquisitionError } from '../lib/errors'
import { fetchOfficialWebsiteSourceContext, type OfficialWebsiteSourceContext } from '../services/official-website-source'
import type { AcquisitionCandidateDto, AcquisitionRunDetail, AcquisitionRunListItem } from '../types'

type RunCreateInput = {
  city_id: string
  category_id: string
  source_url?: string | null
}

type RunRow = {
  id: string
  status: string
  error: string | null
  created_at: Date
  city: { name: string }
  category: { name: string }
  candidates: Array<{ review_status: string }>
}

type CandidateRow = {
  id: string
  name: string
  address: string
  source: string
  match_status: string
  geocode_status: string
  review_status: string
  duplicate_poi_ids: string[]
  google_place_id: string | null
  google_review_payload: Prisma.JsonValue | null
}

export async function createAcquisitionRun(
  input: RunCreateInput,
  adminId: string,
): Promise<AcquisitionRunDetail> {
  const [city, category] = await Promise.all([
    prisma.city.findFirst({
      where: { id: input.city_id, is_active: true, deleted_at: null },
      select: { id: true, name: true, postal_code: true, latitude: true, longitude: true },
    }),
    prisma.category.findFirst({
      where: { id: input.category_id, is_active: true, deleted_at: null },
      select: { id: true, name: true },
    }),
  ])

  if (!city) throw new PoiAcquisitionError('INVALID_CITY', 400)
  if (!category) throw new PoiAcquisitionError('INVALID_CATEGORY', 400)

  const run = await prisma.poiAcquisitionRun.create({
    data: {
      city_id: city.id,
      category_id: category.id,
      status: 'running',
      source: input.source_url ? 'google_places_primary_official_website' : 'google_places_primary',
      started_by: adminId,
    },
    select: { id: true },
  })

  try {
    const officialSourceContext = input.source_url
      ? await fetchOfficialWebsiteSourceContext(input.source_url)
      : null
    const googleCandidates = await searchGooglePlaceCandidates({
      cityName: city.name,
      postalCode: city.postal_code,
      categoryName: category.name,
      latitude: city.latitude,
      longitude: city.longitude,
    })

    for (const candidate of googleCandidates) {
      const description = await generateVerifiedDescription({
        candidate,
        cityName: city.name,
        categoryName: category.name,
        officialSourceContext,
      })
      const geocode = await geocodeForAcquisition(candidate.address, {
        latitude: city.latitude,
        longitude: city.longitude,
      })
      const duplicates = await findDuplicates({
        name: candidate.name,
        address: candidate.address,
        google_place_id: candidate.google_place_id,
        latitude: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.latitude : null,
        longitude: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.longitude : null,
      })

      await prisma.poiAcquisitionCandidate.create({
        data: {
          run_id: run.id,
          source: 'google_places',
          name: candidate.name,
          address: candidate.address,
          description,
          phone: candidate.phone,
          website: candidate.website,
          category_id: category.id,
          google_place_id: candidate.google_place_id,
          google_review_payload: candidate.review_payload ?? Prisma.JsonNull,
          google_review_expires_at: candidate.google_review_expires_at,
          latitude: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.latitude : null,
          longitude: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.longitude : null,
          geocode_status: geocode.status,
          geocode_provider: geocode.status === 'success' || geocode.status === 'pending_review' ? 'mapbox' : null,
          geocode_confidence: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.confidence : null,
          duplicate_poi_ids: duplicates,
          match_status: duplicates.length > 0 ? 'duplicate_candidate' : 'matched',
          review_status: 'needs_review',
        },
      })
    }

    await prisma.poiAcquisitionRun.update({
      where: { id: run.id },
      data: { status: 'completed' },
    })
  } catch (error) {
    await prisma.poiAcquisitionRun.update({
      where: { id: run.id },
      data: { status: 'failed', error: error instanceof Error ? error.message : String(error) },
    })
  }

  const detail = await getAcquisitionRun(run.id)
  if (!detail) throw new PoiAcquisitionError('NOT_FOUND', 404)
  return detail
}

export async function listAcquisitionRuns(): Promise<AcquisitionRunListItem[]> {
  const runs = await prisma.poiAcquisitionRun.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      status: true,
      error: true,
      created_at: true,
      city: { select: { name: true } },
      category: { select: { name: true } },
      candidates: {
        where: { deleted_at: null },
        select: { review_status: true },
      },
    },
    take: 50,
  })

  return (runs as RunRow[]).map(run => ({
    id: run.id,
    status: run.status,
    error: run.error,
    city_name: run.city.name,
    category_name: run.category.name,
    candidate_count: run.candidates.length,
    published_count: run.candidates.filter(candidate => candidate.review_status === 'published').length,
    needs_review_count: run.candidates.filter(candidate => candidate.review_status === 'needs_review').length,
    created_at: run.created_at.toISOString(),
  }))
}

export async function getAcquisitionRun(id: string): Promise<AcquisitionRunDetail | null> {
  const run = await prisma.poiAcquisitionRun.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      status: true,
      error: true,
      city: { select: { name: true } },
      category: { select: { name: true } },
      candidates: {
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          name: true,
          address: true,
          source: true,
          match_status: true,
          geocode_status: true,
          review_status: true,
          duplicate_poi_ids: true,
          google_place_id: true,
          google_review_payload: true,
        },
      },
    },
  })

  if (!run) return null

  return {
    id: run.id,
    status: run.status,
    error: run.error,
    city_name: run.city.name,
    category_name: run.category.name,
    candidates: (run.candidates as CandidateRow[]).map(mapCandidate),
  }
}

function mapCandidate(candidate: CandidateRow): AcquisitionCandidateDto {
  return {
    id: candidate.id,
    name: candidate.name,
    address: candidate.address,
    source: candidate.source,
    match_status: candidate.match_status,
    geocode_status: candidate.geocode_status,
    review_status: candidate.review_status,
    duplicate_poi_ids: candidate.duplicate_poi_ids,
    google_place_id: candidate.google_place_id,
    google_review_payload: isGoogleReviewPayload(candidate.google_review_payload)
      ? candidate.google_review_payload
      : null,
  }
}

async function findDuplicates(candidate: {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
}): Promise<string[]> {
  const pois = await prisma.pointOfInterest.findMany({
    where: {
      is_active: true,
      deleted_at: null,
      OR: [
        ...(candidate.google_place_id ? [{ google_place_id: candidate.google_place_id }] : []),
        { name: { contains: candidate.name, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      google_place_id: true,
    },
    take: 20,
  })

  return findProbableDuplicates(candidate, pois).map(duplicate => duplicate.id)
}

async function generateVerifiedDescription(params: {
  candidate: GooglePlaceCandidate
  cityName: string
  categoryName: string
  officialSourceContext: OfficialWebsiteSourceContext | null
}): Promise<string> {
  try {
    const response = await callGemini(buildVerifiedDescriptionPrompt(params))
    return response[0]?.description.trim() ?? ''
  } catch {
    return ''
  }
}

function buildVerifiedDescriptionPrompt(params: {
  candidate: GooglePlaceCandidate
  cityName: string
  categoryName: string
  officialSourceContext: OfficialWebsiteSourceContext | null
}): string {
  const officialContext = params.officialSourceContext
    ? `

Contexte officiel optionnel:
URL: ${params.officialSourceContext.source_url}
Attribution: ${params.officialSourceContext.attribution}
Extrait:
${params.officialSourceContext.text}`
    : ''

  return `Tu rédiges une description StayLocal réaliste en français pour un POI déjà vérifié.

Règles strictes:
- Ne crée aucun nouveau POI.
- Ne modifie pas le nom, l'adresse, le téléphone ou le site.
- N'invente pas d'horaires, coordonnées, notes, prix ou photos.
- Rédige uniquement une description courte en 2 à 3 phrases.

Données vérifiées:
- Ville: ${params.cityName}
- Catégorie: ${params.categoryName}
- Nom: ${params.candidate.name}
- Adresse: ${params.candidate.address}
- Téléphone: ${params.candidate.phone ?? 'non renseigné'}
- Site: ${params.candidate.website ?? 'non renseigné'}${officialContext}

Format JSON strict:
{
  "pois": [
    {
      "name": ${JSON.stringify(params.candidate.name)},
      "address": ${JSON.stringify(params.candidate.address)},
      "phone": ${JSON.stringify(params.candidate.phone)},
      "website": ${JSON.stringify(params.candidate.website)},
      "description": "string",
      "subcategory": null,
      "hours": null,
      "tags": []
    }
  ]
}`
}

function isGoogleReviewPayload(value: Prisma.JsonValue | null): value is AcquisitionCandidateDto['google_review_payload'] {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
