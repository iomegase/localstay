import { prisma } from '@/shared/lib/prisma'
import type { Prisma } from '@prisma/client'
import { evaluateProfileCompleteness } from '../lib/completeness'
import type { LodgingPublicationStatus } from '../types'

export type AdminLodgingProfileRow = {
  id: string
  publication_status: LodgingPublicationStatus
  title: string
  short_description: string
  lodging: {
    id: string
    name: string
    owner: {
      id: string
      email: string
    }
  }
  city: {
    id: string
    name: string
    slug: string
  }
  photos_count: number
  seo_warnings: string[]
  updated_at: string
}

const adminProfileSelect: Prisma.LodgingPublicProfileSelect = {
  id: true,
  publication_status: true,
  title: true,
  short_description: true,
  updated_at: true,
  content_rights_confirmed_at: true,
  city: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  lodging: {
    select: {
      id: true,
      name: true,
      owner: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
  photos: {
    where: { deleted_at: null },
    select: {
      url: true,
      alt: true,
      is_cover: true,
      room_type: true,
    },
  },
  amenities: {
    where: { deleted_at: null },
    select: {
      code: true,
      label: true,
    },
  },
  description: true,
  property_type: true,
  max_guests: true,
}

type AdminProfileQueryRow = {
  id: string
  publication_status: LodgingPublicationStatus
  title: string
  short_description: string
  updated_at: Date
  content_rights_confirmed_at: Date | null
  city: {
    id: string
    name: string
    slug: string
  }
  lodging: {
    id: string
    name: string
    owner: {
      id: string
      email: string
    }
  }
  photos: Array<{
    url: string
    alt: string
    is_cover: boolean
    room_type: string | null
  }>
  amenities: Array<{
    code: string
    label: string
  }>
  description: string
  property_type: string
  max_guests: number
}

function toAdminRow(
  row: AdminProfileQueryRow,
): AdminLodgingProfileRow {
  const seo = evaluateProfileCompleteness({
    title: row.title,
    short_description: row.short_description,
    description: row.description,
    property_type: row.property_type,
    max_guests: row.max_guests,
    photos: row.photos,
    amenities: row.amenities,
    content_rights_confirmed_at: row.content_rights_confirmed_at,
  })

  return {
    id: row.id,
    publication_status: row.publication_status,
    title: row.title,
    short_description: row.short_description,
    lodging: {
      id: row.lodging.id,
      name: row.lodging.name,
      owner: {
        id: row.lodging.owner.id,
        email: row.lodging.owner.email,
      },
    },
    city: row.city,
    photos_count: row.photos.length,
    seo_warnings: seo.warnings,
    updated_at: row.updated_at.toISOString(),
  }
}

export async function listAdminLodgingProfiles(filters: {
  publication_status?: LodgingPublicationStatus
  city_id?: string
  owner_id?: string
} = {}): Promise<AdminLodgingProfileRow[]> {
  const rows = await prisma.lodgingPublicProfile.findMany({
    where: {
      deleted_at: null,
      ...(filters.publication_status ? { publication_status: filters.publication_status } : {}),
      ...(filters.city_id ? { city_id: filters.city_id } : {}),
      ...(filters.owner_id ? { lodging: { owner_id: filters.owner_id } } : {}),
    },
    orderBy: [{ updated_at: 'desc' }],
    select: adminProfileSelect,
  })

  return rows.map(row => toAdminRow(row as unknown as AdminProfileQueryRow))
}

async function getExistingProfile(profileId: string) {
  return prisma.lodgingPublicProfile.findFirst({
    where: { id: profileId, deleted_at: null },
    select: {
      id: true,
      publication_status: true,
      published_at: true,
      admin_review_note: true,
    },
  })
}

export async function publishLodgingProfile(profileId: string) {
  const profile = await getExistingProfile(profileId)
  if (!profile) return null

  const updated = await prisma.lodgingPublicProfile.update({
    where: { id: profileId },
    data: {
      publication_status: 'published',
      published_at: new Date(),
      admin_review_note: null,
    },
    select: {
      id: true,
      publication_status: true,
      published_at: true,
    },
  })

  return {
    ...updated,
    published_at: updated.published_at?.toISOString() ?? null,
  }
}

export async function requestChangesLodgingProfile(profileId: string, adminReviewNote: string) {
  const profile = await getExistingProfile(profileId)
  if (!profile) return null

  return prisma.lodgingPublicProfile.update({
    where: { id: profileId },
    data: {
      publication_status: 'draft',
      admin_review_note: adminReviewNote,
    },
    select: {
      id: true,
      publication_status: true,
      admin_review_note: true,
    },
  })
}

export async function archiveLodgingProfile(profileId: string) {
  const profile = await getExistingProfile(profileId)
  if (!profile) return null

  return prisma.lodgingPublicProfile.update({
    where: { id: profileId },
    data: {
      publication_status: 'archived',
    },
    select: {
      id: true,
      publication_status: true,
    },
  })
}
