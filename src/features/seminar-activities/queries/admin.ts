import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { listPublishedLocalLandingSummaries } from '@/features/local-seo/queries/landing-pages'
import { seminarActivitySlug } from '../lib/slug'
import { revalidateSeminarActivitySurfaces } from '../lib/revalidation'
import type {
  SeminarActivityCreate,
  SeminarActivityPatch,
  SeminarActivityPlacementsInput,
  SeminarActivityProvidersInput,
  SeminarPlacementOrderInput,
} from '../lib/schemas'
import {
  HUB_SURFACE_KEY,
  SEMINAR_ACTIVITY_CATEGORIES,
  type ProviderSearchItem,
  type SeminarActivityAdmin,
  type SeminarSurfaceOption,
} from '../types'

export type SeminarActivityErrorCode =
  | 'SEMINAR_ACTIVITY_NOT_FOUND'
  | 'SLUG_CONFLICT'
  | 'IMAGE_REQUIRED'
  | 'POI_NOT_FOUND'
  | 'DESTINATION_NOT_FOUND'
  | 'PLACEMENT_MISMATCH'

const ERROR_STATUS: Record<SeminarActivityErrorCode, number> = {
  SEMINAR_ACTIVITY_NOT_FOUND: 404,
  SLUG_CONFLICT: 409,
  IMAGE_REQUIRED: 422,
  POI_NOT_FOUND: 422,
  DESTINATION_NOT_FOUND: 422,
  PLACEMENT_MISMATCH: 422,
}

export const SEMINAR_ACTIVITY_ERROR_MESSAGES: Record<SeminarActivityErrorCode, string> = {
  SEMINAR_ACTIVITY_NOT_FOUND: 'Activité introuvable',
  SLUG_CONFLICT: 'Une activité porte déjà ce titre',
  IMAGE_REQUIRED: 'Ajoutez une image avant de publier l’activité',
  POI_NOT_FOUND: 'Prestataire introuvable ou supprimé',
  DESTINATION_NOT_FOUND: 'Destination locale introuvable',
  PLACEMENT_MISMATCH: 'La liste ne correspond pas aux activités attribuées à cette page',
}

export class SeminarActivityError extends Error {
  readonly status: number
  constructor(public readonly code: SeminarActivityErrorCode) {
    super(code)
    this.status = ERROR_STATUS[code]
  }
}

const ADMIN_SELECT = {
  id: true,
  slug: true,
  title: true,
  category: true,
  description: true,
  season_label: true,
  level_label: true,
  is_published: true,
  image_url: true,
  price_per_person_cents: true,
  price_per_group_cents: true,
  internal_notes: true,
  providers: {
    where: { deleted_at: null },
    orderBy: { created_at: 'asc' },
    select: { poi_id: true, notes: true, poi: { select: { name: true, deleted_at: true, city: { select: { name: true } } } } },
  },
  placements: {
    where: { deleted_at: null },
    orderBy: { surface_key: 'asc' },
    select: { surface_key: true, destination_id: true, position: true },
  },
} satisfies Prisma.SeminarActivitySelect

type AdminRow = Prisma.SeminarActivityGetPayload<{ select: typeof ADMIN_SELECT }>

function toAdmin(row: AdminRow): SeminarActivityAdmin {
  return {
    ...row,
    providers: row.providers.map(provider => ({
      poi_id: provider.poi_id,
      poi_name: provider.poi.name,
      city_name: provider.poi.city.name,
      poi_deleted: provider.poi.deleted_at !== null,
      notes: provider.notes,
    })),
  }
}

async function readAdmin(id: string): Promise<SeminarActivityAdmin> {
  const row = await prisma.seminarActivity.findFirst({ where: { id, deleted_at: null }, select: ADMIN_SELECT })
  if (!row) throw new SeminarActivityError('SEMINAR_ACTIVITY_NOT_FOUND')
  return toAdmin(row)
}

type Tx = Prisma.TransactionClient

async function assertActivity(tx: Tx, id: string): Promise<void> {
  const activity = await tx.seminarActivity.findFirst({ where: { id, deleted_at: null }, select: { id: true } })
  if (!activity) throw new SeminarActivityError('SEMINAR_ACTIVITY_NOT_FOUND')
}

/** Spec 097 AC-01 : catalogue admin, trié par catégorie puis titre. */
export async function listSeminarActivitiesForAdmin(): Promise<SeminarActivityAdmin[]> {
  const rows = await prisma.seminarActivity.findMany({ where: { deleted_at: null }, select: ADMIN_SELECT })
  return rows
    .map(toAdmin)
    .sort((a, b) =>
      SEMINAR_ACTIVITY_CATEGORIES.indexOf(a.category) - SEMINAR_ACTIVITY_CATEGORIES.indexOf(b.category)
      || a.title.localeCompare(b.title, 'fr'))
}

/** Spec 097 AC-01 : création non publiée ; slug unique, y compris parmi les activités supprimées. */
export async function createSeminarActivity(input: SeminarActivityCreate): Promise<SeminarActivityAdmin> {
  const slug = seminarActivitySlug(input.title)
  if (await prisma.seminarActivity.findUnique({ where: { slug }, select: { id: true } })) {
    throw new SeminarActivityError('SLUG_CONFLICT')
  }
  try {
    const row = await prisma.seminarActivity.create({
      data: {
        slug,
        title: input.title,
        category: input.category,
        description: input.description,
        season_label: input.season_label,
        level_label: input.level_label,
        price_per_person_cents: input.price_per_person_cents ?? null,
        price_per_group_cents: input.price_per_group_cents ?? null,
        internal_notes: input.internal_notes ?? null,
      },
      select: ADMIN_SELECT,
    })
    revalidateSeminarActivitySurfaces()
    return toAdmin(row)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new SeminarActivityError('SLUG_CONFLICT')
    throw error
  }
}

/** Spec 097 AC-01 / AC-04 : mise à jour partielle ; publication refusée sans image (BR-06). */
export async function updateSeminarActivity(id: string, input: SeminarActivityPatch): Promise<SeminarActivityAdmin> {
  const existing = await prisma.seminarActivity.findFirst({ where: { id, deleted_at: null }, select: { image_url: true } })
  if (!existing) throw new SeminarActivityError('SEMINAR_ACTIVITY_NOT_FOUND')
  if (input.is_published === true && !existing.image_url) throw new SeminarActivityError('IMAGE_REQUIRED')

  const row = await prisma.seminarActivity.update({ where: { id }, data: input, select: ADMIN_SELECT })
  revalidateSeminarActivitySurfaces()
  return toAdmin(row)
}

/** Spec 097 AC-01 / BR-11 : suppression douce de l'activité, de ses liens et attributions. */
export async function deleteSeminarActivity(id: string): Promise<void> {
  const now = new Date()
  await prisma.$transaction(async tx => {
    const changed = await tx.seminarActivity.updateMany({ where: { id, deleted_at: null }, data: { deleted_at: now, is_published: false } })
    if (!changed.count) throw new SeminarActivityError('SEMINAR_ACTIVITY_NOT_FOUND')
    await tx.seminarActivityPlacement.updateMany({ where: { activity_id: id, deleted_at: null }, data: { deleted_at: now } })
    await tx.seminarActivityProvider.updateMany({ where: { activity_id: id, deleted_at: null }, data: { deleted_at: now } })
  })
  revalidateSeminarActivitySurfaces()
}

/** Spec 097 AC-03 / BR-07 : enregistre l'URL de l'image téléversée. */
export async function setSeminarActivityImage(id: string, imageUrl: string): Promise<SeminarActivityAdmin> {
  const changed = await prisma.seminarActivity.updateMany({ where: { id, deleted_at: null }, data: { image_url: imageUrl } })
  if (!changed.count) throw new SeminarActivityError('SEMINAR_ACTIVITY_NOT_FOUND')
  revalidateSeminarActivitySurfaces()
  return readAdmin(id)
}

/** Spec 097 AC-06 / BR-09 : remplace les prestataires ; un POI supprimé est refusé à l'ajout. */
export async function setSeminarActivityProviders(id: string, input: SeminarActivityProvidersInput): Promise<SeminarActivityAdmin> {
  const now = new Date()
  await prisma.$transaction(async tx => {
    await assertActivity(tx, id)
    const existing = await tx.seminarActivityProvider.findMany({ where: { activity_id: id }, select: { poi_id: true, deleted_at: true } })
    const active = new Set(existing.filter(link => link.deleted_at === null).map(link => link.poi_id))

    const added = input.providers.map(provider => provider.poi_id).filter(poiId => !active.has(poiId))
    if (added.length) {
      const found = await tx.pointOfInterest.count({ where: { id: { in: added }, deleted_at: null } })
      if (found !== added.length) throw new SeminarActivityError('POI_NOT_FOUND')
    }

    for (const provider of input.providers) {
      const notes = provider.notes ?? null
      await tx.seminarActivityProvider.upsert({
        where: { activity_id_poi_id: { activity_id: id, poi_id: provider.poi_id } },
        update: { deleted_at: null, notes },
        create: { activity_id: id, poi_id: provider.poi_id, notes },
      })
    }

    const wanted = new Set(input.providers.map(provider => provider.poi_id))
    const removed = [...active].filter(poiId => !wanted.has(poiId))
    if (removed.length) {
      await tx.seminarActivityProvider.updateMany({ where: { activity_id: id, poi_id: { in: removed }, deleted_at: null }, data: { deleted_at: now } })
    }
  })
  return readAdmin(id)
}

async function nextPosition(tx: Tx, surfaceKey: string): Promise<number> {
  const result = await tx.seminarActivityPlacement.aggregate({
    where: { surface_key: surfaceKey, deleted_at: null },
    _max: { position: true },
  })
  return (result._max.position ?? -1) + 1
}

/** Spec 097 AC-07 / BR-05 / BR-10 / BR-11 : attributions indépendantes par surface. */
export async function setSeminarActivityPlacements(id: string, input: SeminarActivityPlacementsInput): Promise<SeminarActivityAdmin> {
  const now = new Date()
  await prisma.$transaction(async tx => {
    await assertActivity(tx, id)
    if (input.destination_ids.length) {
      const found = await tx.localLandingDestination.count({ where: { id: { in: input.destination_ids }, deleted_at: null } })
      if (found !== input.destination_ids.length) throw new SeminarActivityError('DESTINATION_NOT_FOUND')
    }

    const wanted = [
      ...(input.include_hub ? [{ surface_key: HUB_SURFACE_KEY, destination_id: null }] : []),
      ...input.destination_ids.map(destinationId => ({ surface_key: destinationId, destination_id: destinationId })),
    ]
    const existing = await tx.seminarActivityPlacement.findMany({
      where: { activity_id: id },
      select: { id: true, surface_key: true, deleted_at: true },
    })

    for (const surface of wanted) {
      const row = existing.find(item => item.surface_key === surface.surface_key)
      if (row && row.deleted_at === null) continue
      const position = await nextPosition(tx, surface.surface_key)
      if (row) {
        await tx.seminarActivityPlacement.update({ where: { id: row.id }, data: { deleted_at: null, position } })
      } else {
        await tx.seminarActivityPlacement.create({ data: { activity_id: id, ...surface, position } })
      }
    }

    const wantedKeys = new Set(wanted.map(surface => surface.surface_key))
    const removed = existing.filter(item => item.deleted_at === null && !wantedKeys.has(item.surface_key)).map(item => item.id)
    if (removed.length) {
      await tx.seminarActivityPlacement.updateMany({ where: { id: { in: removed } }, data: { deleted_at: now } })
    }
  })
  revalidateSeminarActivitySurfaces()
  return readAdmin(id)
}

/** Spec 097 AC-08 : réordonne les cartes d'une surface ; la liste doit correspondre exactement. */
export async function reorderSeminarSurface(input: SeminarPlacementOrderInput): Promise<void> {
  await prisma.$transaction(async tx => {
    const placements = await tx.seminarActivityPlacement.findMany({
      where: { surface_key: input.surface_key, deleted_at: null, activity: { deleted_at: null } },
      select: { id: true, activity_id: true },
    })
    const byActivity = new Map(placements.map(placement => [placement.activity_id, placement.id]))
    const matches = input.activity_ids.length === placements.length
      && new Set(input.activity_ids).size === input.activity_ids.length
      && input.activity_ids.every(activityId => byActivity.has(activityId))
    if (!matches) throw new SeminarActivityError('PLACEMENT_MISMATCH')

    for (const [position, activityId] of input.activity_ids.entries()) {
      await tx.seminarActivityPlacement.update({ where: { id: byActivity.get(activityId) }, data: { position } })
    }
  })
  revalidateSeminarActivitySurfaces()
}

/** Spec 097 BR-09 : recherche de POI non supprimés par nom, toutes villes. */
export async function searchProviderPois(q: string): Promise<ProviderSearchItem[]> {
  const rows = await prisma.pointOfInterest.findMany({
    where: { deleted_at: null, name: { contains: q, mode: 'insensitive' } },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: 20,
    select: { id: true, name: true, city: { select: { name: true } } },
  })
  return rows.map(row => ({ poi_id: row.id, poi_name: row.name, city_name: row.city.name }))
}

/** Spec 097 UI « Diffusion » : destinations locales et statut de leur landing séminaire. */
export async function listSeminarSurfaceOptions(): Promise<SeminarSurfaceOption[]> {
  const [destinations, published] = await Promise.all([
    prisma.localLandingDestination.findMany({
      where: { deleted_at: null },
      orderBy: [{ city: { name: 'asc' } }, { id: 'asc' }],
      select: { id: true, city: { select: { name: true } } },
    }),
    listPublishedLocalLandingSummaries(),
  ])
  const publishedSeminar = new Set(published.filter(item => item.publication.seminar).map(item => item.id))
  return destinations.map(destination => ({
    destination_id: destination.id,
    city_name: destination.city.name,
    seminar_published: publishedSeminar.has(destination.id),
  }))
}
