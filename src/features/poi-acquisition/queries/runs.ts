import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { callGemini } from '@/features/gemini-fetch/services/gemini-client'
import {
  getGooglePlaceCandidate,
  searchGooglePlaceCandidates,
  type GooglePlaceCandidate,
} from '../lib/google-places'
import { classifyTypeMatch, planTypeQueries } from '../lib/google-types'
import { filterCandidatesForVillage } from '../lib/village'
import { filterByReviewMemory } from '../lib/review-memory'
import { loadCityReviewMemories } from './review-memory'
import { deserializePendingPlaces, serializePendingPlaces } from '../lib/pending-places'
import { mergeHoursIntoReviewPayload } from '../lib/google-hours'
import { geocodeForAcquisition } from '../lib/geocode'
import { findProbableDuplicates } from '../lib/duplicate-detection'
import { PoiAcquisitionError } from '../lib/errors'
import { fetchOfficialWebsiteSourceContext, type OfficialWebsiteSourceContext } from '../services/official-website-source'
import type { AcquisitionCandidateDto, AcquisitionRunDetail, AcquisitionRunListItem } from '../types'
import { DESCRIPTION_LENGTH_INSTRUCTION, limitToWords } from '@/shared/lib/description-length'
import { sanitizeDescriptionSources } from '@/shared/lib/description-sources'

type RunCreateInput = {
  city_id: string
  category_id: string
  source_url?: string | null
  /** Spec 066 US-04 : run à candidat unique choisi par recherche par nom. */
  google_place_id?: string | null
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
  business_status: string | null
  phone: string | null
  website: string | null
  description: string | null
  description_sources?: Prisma.JsonValue | null
  category_id: string
  subcategory_id: string | null
  primary_type?: string | null
  type_match?: string | null
}

const STORED_BUSINESS_STATUSES = new Set(['OPERATIONAL', 'CLOSED_TEMPORARILY'])

function runSource(input: RunCreateInput): string {
  if (input.google_place_id) return 'google_places_name'
  return input.source_url ? 'google_places_primary_official_website' : 'google_places_primary'
}

export async function createAcquisitionRun(
  input: RunCreateInput,
  adminId: string,
): Promise<AcquisitionRunDetail> {
  const [city, category, activeCities] = await Promise.all([
    prisma.city.findFirst({
      where: { id: input.city_id, is_active: true, deleted_at: null },
      select: { id: true, slug: true, name: true, postal_code: true, latitude: true, longitude: true },
    }),
    prisma.category.findFirst({
      where: { id: input.category_id, is_active: true, deleted_at: null },
      select: {
        id: true,
        name: true,
        google_types: true,
        subcategories: {
          where: { is_active: true, deleted_at: null },
          select: { id: true, name: true, google_types: true },
        },
      },
    }),
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      select: { id: true, slug: true, name: true, latitude: true, longitude: true },
    }),
  ])

  if (!city) throw new PoiAcquisitionError('INVALID_CITY', 400)
  if (!category) throw new PoiAcquisitionError('INVALID_CATEGORY', 400)

  const run = await prisma.poiAcquisitionRun.create({
    data: {
      city_id: city.id,
      category_id: category.id,
      status: 'running',
      source: runSource(input),
      started_by: adminId,
      // Spec 072 BR-03 : contexte officiel réutilisé à la reprise.
      source_url: input.source_url ?? null,
    },
    select: { id: true },
  })

  try {
    const subcategories = category.subcategories ?? []
    let googleCandidates: GooglePlaceCandidate[]
    let skippedOtherVillage = 0
    let skippedClosedPermanently = 0
    let skippedRejected = 0
    let skippedExcluded = 0
    if (input.google_place_id) {
      // Spec 066 BR-05 : le choix explicite de l'admin n'est pas filtré.
      const chosen = await getGooglePlaceCandidate(input.google_place_id)
      googleCandidates = chosen ? [chosen] : []
    } else {
      const searched = await searchGooglePlaceCandidates({
        cityName: city.name,
        postalCode: city.postal_code,
        categoryName: category.name,
        subcategoryNames: subcategories.map(subcategory => subcategory.name),
        sourceUrl: input.source_url ?? null,
        typeQueries: planTypeQueries({
          categoryTypes: category.google_types ?? [],
          subcategories: subcategories.map(subcategory => ({ name: subcategory.name, types: subcategory.google_types ?? [] })),
        }),
        latitude: city.latitude,
        longitude: city.longitude,
      })
      const villageCities = activeCities.some(activeCity => activeCity.id === city.id)
        ? activeCities
        : [...activeCities, city]
      const filtered = filterCandidatesForVillage(searched, villageCities, city.id)
      skippedOtherVillage = filtered.skippedOtherVillage
      skippedClosedPermanently = filtered.skippedClosedPermanently
      // Spec 071 BR-03 : lieux déjà rejetés pour cette catégorie ou exclus de la ville.
      const remembered = filterByReviewMemory(filtered.kept, await loadCityReviewMemories(city.id), category.id)
      googleCandidates = remembered.kept
      skippedRejected = remembered.skippedRejected
      skippedExcluded = remembered.skippedExcluded
    }
    // Spec 072 AC-01-01 : la liste retenue est enregistrée avant tout traitement payant.
    await prisma.poiAcquisitionRun.update({
      where: { id: run.id },
      data: {
        pending_places: serializePendingPlaces(googleCandidates),
        skipped_other_village: skippedOtherVillage,
        skipped_closed_permanently: skippedClosedPermanently,
        skipped_rejected: skippedRejected,
        skipped_excluded: skippedExcluded,
      },
    })
    await processPendingCandidates(run.id, { deadline: Date.now() + RUN_TIME_BUDGET_MS })
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

// Spec 072 AC-01-03 : budget de traitement par requête (fonction Vercel à 300 s).
const RUN_TIME_BUDGET_MS = 240_000
// Spec 072 BR-01 : candidats traités simultanément.
const CANDIDATE_CONCURRENCY = 5
// Spec 072 AC-03-01 : sans nouvelle depuis ce délai, un run « running » est considéré interrompu.
const STALLED_RUN_MS = 10 * 60 * 1000

type ProcessContext = {
  runId: string
  city: { name: string; latitude: number; longitude: number }
  category: { id: string; name: string }
  subcategoryIdByName: Map<string, string>
  /** Spec 073 : types Google acceptés (catégorie + sous-catégories). */
  acceptedTypes: string[]
  officialSourceContext: OfficialWebsiteSourceContext | null
  websiteContextCache: Map<string, Promise<OfficialWebsiteSourceContext | null>>
}

async function processCandidate(candidate: GooglePlaceCandidate, context: ProcessContext): Promise<void> {
  const candidateOfficialSourceContext = candidate.website
    ? await getCachedOfficialWebsiteSourceContext(candidate.website, context.websiteContextCache)
    : null
  const description = await generateVerifiedDescription({
    candidate,
    cityName: context.city.name,
    categoryName: context.category.name,
    officialSourceContext: context.officialSourceContext,
    candidateOfficialSourceContext,
  })
  const geocode = await geocodeForAcquisition(candidate.address, {
    latitude: context.city.latitude,
    longitude: context.city.longitude,
  })
  const located = geocode.status === 'success' || geocode.status === 'pending_review'
  const duplicates = await findDuplicates({
    name: candidate.name,
    address: candidate.address,
    google_place_id: candidate.google_place_id,
    latitude: located ? geocode.latitude : null,
    longitude: located ? geocode.longitude : null,
  })
  const subcategoryId = candidate.query_subcategory_name
    ? context.subcategoryIdByName.get(normalizeNameKey(candidate.query_subcategory_name)) ?? null
    : null

  await createCandidateWithRetry({
    run_id: context.runId,
    source: 'google_places',
    name: candidate.name,
    address: candidate.address,
    description,
    phone: candidate.phone,
    website: candidate.website,
    category_id: context.category.id,
    subcategory_id: subcategoryId,
    google_place_id: candidate.google_place_id,
    business_status: candidate.business_status && STORED_BUSINESS_STATUSES.has(candidate.business_status)
      ? candidate.business_status
      : null,
    google_review_payload: mergeHoursIntoReviewPayload(candidate.review_payload, candidate.hours),
    google_review_expires_at: candidate.google_review_expires_at,
    latitude: located ? geocode.latitude : null,
    longitude: located ? geocode.longitude : null,
    geocode_status: geocode.status,
    geocode_provider: located ? 'mapbox' : null,
    geocode_confidence: located ? geocode.confidence : null,
    duplicate_poi_ids: duplicates,
    match_status: duplicates.length > 0 ? 'duplicate_candidate' : 'matched',
    review_status: 'needs_review',
    // Spec 094 AC-02 : pages officielles lues pour rédiger la description.
    ...(description
      ? { description_sources: officialDescriptionSources([candidateOfficialSourceContext, context.officialSourceContext]) }
      : {}),
    primary_type: candidate.primary_type ?? null,
    type_match: classifyTypeMatch(candidate.primary_type ?? null, candidate.types ?? [], context.acceptedTypes),
  })
}

/**
 * Spec 072 US-01 : traite les candidats en attente par lots de 5 en parallèle, met le
 * run à jour après chaque lot et s'arrête au budget de temps (statut partial s'il reste
 * des lieux, completed sinon).
 */
export async function processPendingCandidates(
  runId: string,
  options: { deadline: number; now?: () => number },
): Promise<{ processed: number; remaining: number; status: 'completed' | 'partial' }> {
  const now = options.now ?? Date.now
  const run = await prisma.poiAcquisitionRun.findFirst({
    where: { id: runId, deleted_at: null },
    select: {
      id: true,
      error: true,
      source_url: true,
      pending_places: true,
      city: { select: { name: true, latitude: true, longitude: true } },
      category: {
        select: {
          id: true,
          name: true,
          google_types: true,
          subcategories: { where: { is_active: true, deleted_at: null }, select: { id: true, name: true, google_types: true } },
        },
      },
    },
  })
  if (!run) throw new PoiAcquisitionError('NOT_FOUND', 404)

  const context: ProcessContext = {
    runId,
    city: run.city,
    category: run.category,
    subcategoryIdByName: new Map(
      (run.category.subcategories ?? []).map(subcategory => [normalizeNameKey(subcategory.name), subcategory.id]),
    ),
    acceptedTypes: [
      ...(run.category.google_types ?? []),
      ...(run.category.subcategories ?? []).flatMap(subcategory => subcategory.google_types ?? []),
    ],
    officialSourceContext: run.source_url ? await fetchOfficialWebsiteSourceContext(run.source_url) : null,
    websiteContextCache: new Map(),
  }

  const remaining = deserializePendingPlaces(run.pending_places)
  const errors: string[] = []
  let processed = 0

  while (remaining.length > 0 && now() < options.deadline) {
    const batch = remaining.splice(0, CANDIDATE_CONCURRENCY)
    const results = await Promise.allSettled(batch.map(candidate => processCandidate(candidate, context)))
    results.forEach((result, index) => {
      if (result.status === 'rejected') errors.push(`${batch[index]!.name}: ${messageFromError(result.reason)}`)
    })
    processed += batch.length
    await prisma.poiAcquisitionRun.update({
      where: { id: runId },
      data: { pending_places: serializePendingPlaces(remaining), processed_count: { increment: batch.length } },
    })
  }

  const status = remaining.length > 0 ? 'partial' : 'completed'
  const errorParts = [
    run.error,
    errors.length > 0 ? `Acquisition partielle: ${errors.slice(0, 5).join(' | ')}` : null,
  ].filter((part): part is string => Boolean(part))
  await prisma.poiAcquisitionRun.update({
    where: { id: runId },
    data: { status, ...(errorParts.length > 0 ? { error: errorParts.join(' · ').slice(0, 2000) } : {}) },
  })
  return { processed, remaining: remaining.length, status }
}

/** Spec 072 US-02 : reprend un run partiel, sans nouvelle recherche Google. */
export async function resumeAcquisitionRun(runId: string): Promise<AcquisitionRunDetail> {
  await markStalledRuns()
  const run = await prisma.poiAcquisitionRun.findFirst({
    where: { id: runId, deleted_at: null },
    select: { id: true, status: true },
  })
  if (!run) throw new PoiAcquisitionError('NOT_FOUND', 404)
  if (run.status !== 'partial') throw new PoiAcquisitionError('RUN_NOT_RESUMABLE', 409)

  await prisma.poiAcquisitionRun.update({ where: { id: runId }, data: { status: 'running' } })
  try {
    await processPendingCandidates(runId, { deadline: Date.now() + RUN_TIME_BUDGET_MS })
  } catch (error) {
    await prisma.poiAcquisitionRun.update({
      where: { id: runId },
      data: { status: 'partial', error: messageFromError(error) },
    })
  }
  const detail = await getAcquisitionRun(runId)
  if (!detail) throw new PoiAcquisitionError('NOT_FOUND', 404)
  return detail
}

/**
 * Spec 072 AC-03-01 : un run resté « running » sans mise à jour depuis 10 minutes a été
 * interrompu (durée maximale) : il devient partiel s'il reste des lieux, terminé sinon.
 */
export async function markStalledRuns(at: Date = new Date()): Promise<void> {
  const stalled = await prisma.poiAcquisitionRun.findMany({
    where: { deleted_at: null, status: 'running', updated_at: { lt: new Date(at.getTime() - STALLED_RUN_MS) } },
    select: { id: true, pending_places: true, error: true },
  })
  for (const run of stalled) {
    const hasRemaining = deserializePendingPlaces(run.pending_places).length > 0
    await prisma.poiAcquisitionRun.update({
      where: { id: run.id },
      data: {
        status: hasRemaining ? 'partial' : 'completed',
        error: run.error ?? 'Lancement interrompu par la durée maximale d’exécution.',
      },
    })
  }
}

export async function deleteAcquisitionRun(id: string, adminId: string): Promise<void> {
  const run = await prisma.poiAcquisitionRun.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  })
  if (!run) throw new PoiAcquisitionError('NOT_FOUND', 404)

  const now = new Date()
  await prisma.$transaction([
    prisma.poiAcquisitionCandidate.updateMany({
      where: { run_id: id, deleted_at: null },
      data: { deleted_at: now },
    }),
    prisma.poiAcquisitionRun.update({
      where: { id },
      data: { deleted_at: now },
    }),
    prisma.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        actor_type: 'ADMIN',
        action: 'run_deleted',
        target_type: 'PoiAcquisitionRun',
        target_id: id,
        run_id: id,
      },
    }),
  ])
}

export async function listAcquisitionRuns(): Promise<AcquisitionRunListItem[]> {
  await markStalledRuns()
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
  await markStalledRuns()
  const run = await prisma.poiAcquisitionRun.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      status: true,
      error: true,
      pending_places: true,
      processed_count: true,
      skipped_other_village: true,
      skipped_closed_permanently: true,
      skipped_rejected: true,
      skipped_excluded: true,
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
          business_status: true,
          // Spec 071 US-01 : champs modifiables avant publication.
          phone: true,
          website: true,
          description: true,
          description_sources: true,
          category_id: true,
          subcategory_id: true,
          primary_type: true,
          type_match: true,
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
    skipped_other_village: run.skipped_other_village ?? 0,
    skipped_closed_permanently: run.skipped_closed_permanently ?? 0,
    skipped_rejected: run.skipped_rejected ?? 0,
    skipped_excluded: run.skipped_excluded ?? 0,
    // Spec 072 AC-02-03 : lieux restant à traiter.
    pending_count: deserializePendingPlaces(run.pending_places).length,
    processed_count: run.processed_count ?? 0,
    // Spec 071 AC-03-01 : les candidats exclus disparaissent de la revue (comptés).
    excluded_candidates: (run.candidates as CandidateRow[]).filter(candidate => candidate.review_status === 'excluded').length,
    candidates: (run.candidates as CandidateRow[])
      .filter(candidate => candidate.review_status !== 'excluded')
      .map(mapCandidate),
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
    business_status: candidate.business_status ?? null,
    phone: candidate.phone ?? null,
    website: candidate.website ?? null,
    description: candidate.description ?? null,
    description_sources: sanitizeDescriptionSources(candidate.description_sources),
    category_id: candidate.category_id,
    subcategory_id: candidate.subcategory_id ?? null,
    primary_type: candidate.primary_type ?? null,
    type_match: candidate.type_match ?? null,
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

type CandidateCreateData = Parameters<typeof prisma.poiAcquisitionCandidate.create>[0]['data']

async function createCandidateWithRetry(data: CandidateCreateData): Promise<void> {
  const maxAttempts = 3
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.poiAcquisitionCandidate.create({ data })
      return
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || !isTransientPrismaPoolError(error)) break
      await sleep(25 * attempt)
    }
  }

  throw lastError
}

function isTransientPrismaPoolError(error: unknown): boolean {
  const code = Reflect.get(Object(error), 'code')
  if (code === 'P2024') return true
  return messageFromError(error).includes('Timed out fetching a new connection from the connection pool')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeNameKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Spec 094 AC-02 : sources = site officiel du lieu, puis source officielle du run. */
function officialDescriptionSources(contexts: Array<OfficialWebsiteSourceContext | null>): Prisma.InputJsonValue {
  return sanitizeDescriptionSources(
    contexts.filter((item): item is OfficialWebsiteSourceContext => item !== null)
      .map(item => ({ url: item.source_url, title: item.attribution })),
  )
}

async function generateVerifiedDescription(params: {
  candidate: GooglePlaceCandidate
  cityName: string
  categoryName: string
  officialSourceContext: OfficialWebsiteSourceContext | null
  candidateOfficialSourceContext: OfficialWebsiteSourceContext | null
}): Promise<string> {
  try {
    const response = await callGemini(buildVerifiedDescriptionPrompt(params))
    // Spec 093 AC-04 : jamais plus de 300 mots.
    return limitToWords(response[0]?.description ?? '')
  } catch {
    return ''
  }
}

function buildVerifiedDescriptionPrompt(params: {
  candidate: GooglePlaceCandidate
  cityName: string
  categoryName: string
  officialSourceContext: OfficialWebsiteSourceContext | null
  candidateOfficialSourceContext: OfficialWebsiteSourceContext | null
}): string {
  const runOfficialContext = params.officialSourceContext
    ? `

Contexte officiel fourni au lancement du run:
URL: ${params.officialSourceContext.source_url}
Attribution: ${params.officialSourceContext.attribution}
Extrait:
${params.officialSourceContext.text}`
    : ''
  const candidateOfficialContext = params.candidateOfficialSourceContext
    ? `

Site officiel du candidat:
URL: ${params.candidateOfficialSourceContext.source_url}
Attribution: ${params.candidateOfficialSourceContext.attribution}
Extrait:
${params.candidateOfficialSourceContext.text}`
    : ''

  return `Tu rédiges une description MyStay réaliste en français pour un POI déjà vérifié.

Règles strictes:
- Ne crée aucun nouveau POI.
- Ne modifie pas le nom, l'adresse, le téléphone ou le site.
- N'invente pas d'horaires, coordonnées, notes, prix ou photos.
- Rédige uniquement la description. ${DESCRIPTION_LENGTH_INSTRUCTION}

Données vérifiées:
- Ville: ${params.cityName}
- Catégorie: ${params.categoryName}
- Nom: ${params.candidate.name}
- Adresse: ${params.candidate.address}
- Téléphone: ${params.candidate.phone ?? 'non renseigné'}
- Site: ${params.candidate.website ?? 'non renseigné'}${runOfficialContext}${candidateOfficialContext}

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

function getCachedOfficialWebsiteSourceContext(
  website: string,
  cache: Map<string, Promise<OfficialWebsiteSourceContext | null>>,
): Promise<OfficialWebsiteSourceContext | null> {
  const cached = cache.get(website)
  if (cached) return cached

  const request = fetchOfficialWebsiteSourceContext(website)
  cache.set(website, request)
  return request
}

function isGoogleReviewPayload(value: Prisma.JsonValue | null): value is AcquisitionCandidateDto['google_review_payload'] {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
