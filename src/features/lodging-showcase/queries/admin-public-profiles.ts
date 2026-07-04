import { prisma } from '@/shared/lib/prisma'
import type { Prisma } from '@prisma/client'
import { evaluateProfileCompleteness } from '../lib/completeness'
import type { LodgingPublicationStatus } from '../types'

export type AdminLodgingProfileRow = {
  id: string
  profile_id: string | null
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
  deleted_at: true,
  publication_status: true,
  title: true,
  short_description: true,
  updated_at: true,
  content_rights_confirmed_at: true,
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

const adminLodgingSelect = {
  id: true,
  name: true,
  updated_at: true,
  owner: {
    select: {
      id: true,
      email: true,
    },
  },
  city: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  public_profile: {
    select: adminProfileSelect,
  },
} satisfies Prisma.LodgingSelect

type AdminLodgingQueryRow = Prisma.LodgingGetPayload<{ select: typeof adminLodgingSelect }>
type AdminProfileQueryRow = NonNullable<AdminLodgingQueryRow['public_profile']>

function toAdminRow(
  lodging: AdminLodgingQueryRow,
  profile: AdminProfileQueryRow,
): AdminLodgingProfileRow {
  const seo = evaluateProfileCompleteness({
    title: profile.title,
    short_description: profile.short_description,
    description: profile.description,
    property_type: profile.property_type,
    max_guests: profile.max_guests,
    photos: profile.photos,
    amenities: profile.amenities,
    content_rights_confirmed_at: profile.content_rights_confirmed_at,
  })

  return {
    id: profile.id,
    profile_id: profile.id,
    publication_status: profile.publication_status,
    title: profile.title,
    short_description: profile.short_description,
    lodging: {
      id: lodging.id,
      name: lodging.name,
      owner: {
        id: lodging.owner.id,
        email: lodging.owner.email,
      },
    },
    city: lodging.city,
    photos_count: profile.photos.length,
    seo_warnings: seo.warnings,
    updated_at: profile.updated_at.toISOString(),
  }
}

function toMissingProfileAdminRow(lodging: AdminLodgingQueryRow): AdminLodgingProfileRow {
  return {
    id: lodging.id,
    profile_id: null,
    publication_status: 'draft',
    title: lodging.name,
    short_description: '',
    lodging: {
      id: lodging.id,
      name: lodging.name,
      owner: {
        id: lodging.owner.id,
        email: lodging.owner.email,
      },
    },
    city: lodging.city,
    photos_count: 0,
    seo_warnings: ['public_profile_missing'],
    updated_at: lodging.updated_at.toISOString(),
  }
}

function buildPublicationStatusFilter(
  publicationStatus?: LodgingPublicationStatus,
): Prisma.LodgingWhereInput {
  if (!publicationStatus) return {}

  if (publicationStatus === 'draft') {
    return {
      OR: [
        { public_profile: { is: null } },
        { public_profile: { is: { deleted_at: null, publication_status: 'draft' } } },
      ],
    }
  }

  return {
    public_profile: {
      is: {
        deleted_at: null,
        publication_status: publicationStatus,
      },
    },
  }
}

export async function listAdminLodgingProfiles(filters: {
  publication_status?: LodgingPublicationStatus
  city_id?: string
  owner_id?: string
} = {}): Promise<AdminLodgingProfileRow[]> {
  const rows = await prisma.lodging.findMany({
    where: {
      deleted_at: null,
      is_active: true,
      city: {
        deleted_at: null,
        is_active: true,
      },
      ...(filters.city_id ? { city_id: filters.city_id } : {}),
      ...(filters.owner_id ? { owner_id: filters.owner_id } : {}),
      ...buildPublicationStatusFilter(filters.publication_status),
    },
    orderBy: [{ updated_at: 'desc' }],
    select: adminLodgingSelect,
  })

  return rows
    .map(row => {
      const profile = row.public_profile?.deleted_at === null ? row.public_profile : null
      return profile ? toAdminRow(row, profile) : toMissingProfileAdminRow(row)
    })
    .sort((first, second) => Date.parse(second.updated_at) - Date.parse(first.updated_at))
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
