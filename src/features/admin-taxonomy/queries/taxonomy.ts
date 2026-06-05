import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import type {
  AdminCategory,
  AdminSubCategory,
  CategoryCreateInput,
  CategoryPatchInput,
  SubCategoryCreateInput,
  SubCategoryPatchInput,
} from '../types'

export class ApiTaxonomyError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code)
  }
}

type CategoryLockInput = {
  id: string
  slug: string
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
  _count: { pois: number }
  subcategories: Array<{
    id: string
    category_id: string
    name: string
    slug: string
    sort_order: number
    is_active: boolean
    _count: { pois: number }
  }>
}

type AuditPayload = Prisma.InputJsonObject

type TaxonomyLockMaps = {
  categoryLocks: Set<string>
  subCategoryLocks: Set<string>
}

export async function getCategorySlugLock(category: CategoryLockInput): Promise<boolean> {
  const [
    activePoiCount,
    geminiCacheCount,
    cacheTtlCount,
    customizationCount,
    analyticsCount,
  ] = await Promise.all([
    prisma.pointOfInterest.count({
      where: { category_id: category.id, is_active: true, deleted_at: null },
    }),
    prisma.geminiCache.count({ where: { category_id: category.id } }),
    prisma.cacheTtlConfig.count({ where: { category_slug: category.slug } }),
    prisma.lodgingCustomization.count({
      where: { deleted_at: null, category_order: { has: category.slug } },
    }),
    prisma.analytics.count({ where: { category_id: category.id } }),
  ])

  return activePoiCount + geminiCacheCount + cacheTtlCount + customizationCount + analyticsCount > 0
}

export async function getSubCategorySlugLock(subCategoryId: string): Promise<boolean> {
  const activePoiCount = await prisma.pointOfInterest.count({
    where: { subcategory_id: subCategoryId, is_active: true, deleted_at: null },
  })
  return activePoiCount > 0
}

export async function getAdminTaxonomy(): Promise<AdminCategory[]> {
  const categories = await prisma.category.findMany({
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sort_order: true,
      is_active: true,
      _count: {
        select: {
          pois: { where: { is_active: true, deleted_at: null } },
        },
      },
      subcategories: {
        where: { deleted_at: null },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          category_id: true,
          name: true,
          slug: true,
          sort_order: true,
          is_active: true,
          _count: {
            select: {
              pois: { where: { is_active: true, deleted_at: null } },
            },
          },
        },
      },
    },
  })

  const rows = categories as CategoryRow[]
  const locks = await getTaxonomyLockMaps(rows)

  return rows.map(category => mapCategory(category, locks))
}

export async function createCategory(input: CategoryCreateInput, adminId: string): Promise<AdminCategory> {
  await assertCategorySlugAvailable(input.slug)

  return prisma.$transaction(async tx => {
    const category = await tx.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        icon: input.icon,
        sort_order: input.sort_order,
        is_active: input.is_active,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        sort_order: true,
        is_active: true,
      },
    })

    await createAuditLog(tx, {
      adminId,
      action: 'category_created',
      targetType: 'category',
      targetId: category.id,
      before: null,
      after: categoryAuditPayload(category),
    })

    return {
      ...category,
      slug_locked: false,
      poi_count: 0,
      subcategory_count: 0,
      subcategories: [],
    }
  })
}

export async function updateCategory(
  id: string,
  input: CategoryPatchInput,
  adminId: string,
): Promise<AdminCategory> {
  const existing = await prisma.category.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sort_order: true,
      is_active: true,
    },
  })
  if (!existing) throw new ApiTaxonomyError('NOT_FOUND', 404)

  if (input.slug !== undefined && input.slug !== existing.slug) {
    const locked = await getCategorySlugLock({ id: existing.id, slug: existing.slug })
    if (locked) throw new ApiTaxonomyError('SLUG_LOCKED', 409)
    await assertCategorySlugAvailable(input.slug, existing.id)
  }

  const updated = await prisma.$transaction(async tx => {
    const category = await tx.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        sort_order: true,
        is_active: true,
      },
    })

    await createAuditLog(tx, {
      adminId,
      action: input.is_active === false ? 'category_disabled' : 'category_updated',
      targetType: 'category',
      targetId: category.id,
      before: categoryAuditPayload(existing),
      after: categoryAuditPayload(category),
    })

    return category
  })

  return getCategoryById(updated.id)
}

export async function createSubCategory(
  categoryId: string,
  input: SubCategoryCreateInput,
  adminId: string,
): Promise<AdminSubCategory> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!category) throw new ApiTaxonomyError('NOT_FOUND', 404)

  await assertSubCategorySlugAvailable(input.slug)

  return prisma.$transaction(async tx => {
    const subcategory = await tx.subCategory.create({
      data: {
        name: input.name,
        slug: input.slug,
        sort_order: input.sort_order,
        is_active: input.is_active,
        category_id: categoryId,
      },
      select: {
        id: true,
        category_id: true,
        name: true,
        slug: true,
        sort_order: true,
        is_active: true,
      },
    })

    await createAuditLog(tx, {
      adminId,
      action: 'subcategory_created',
      targetType: 'subcategory',
      targetId: subcategory.id,
      before: null,
      after: subCategoryAuditPayload(subcategory),
    })

    return {
      ...subcategory,
      slug_locked: false,
      poi_count: 0,
    }
  })
}

export async function updateSubCategory(
  id: string,
  input: SubCategoryPatchInput,
  adminId: string,
): Promise<AdminSubCategory> {
  const existing = await prisma.subCategory.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      category_id: true,
      name: true,
      slug: true,
      sort_order: true,
      is_active: true,
    },
  })
  if (!existing) throw new ApiTaxonomyError('NOT_FOUND', 404)

  if (input.slug !== undefined && input.slug !== existing.slug) {
    const locked = await getSubCategorySlugLock(existing.id)
    if (locked) throw new ApiTaxonomyError('SLUG_LOCKED', 409)
    await assertSubCategorySlugAvailable(input.slug, existing.id)
  }

  const updated = await prisma.$transaction(async tx => {
    const subcategory = await tx.subCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      },
      select: {
        id: true,
        category_id: true,
        name: true,
        slug: true,
        sort_order: true,
        is_active: true,
      },
    })

    await createAuditLog(tx, {
      adminId,
      action: input.is_active === false ? 'subcategory_disabled' : 'subcategory_updated',
      targetType: 'subcategory',
      targetId: subcategory.id,
      before: subCategoryAuditPayload(existing),
      after: subCategoryAuditPayload(subcategory),
    })

    return subcategory
  })

  return {
    ...updated,
    slug_locked: await getSubCategorySlugLock(updated.id),
    poi_count: await prisma.pointOfInterest.count({
      where: { subcategory_id: updated.id, is_active: true, deleted_at: null },
    }),
  }
}

export async function deleteCategory(id: string, adminId: string): Promise<{ id: string; deleted: true }> {
  const existing = await prisma.category.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, name: true, slug: true, icon: true, sort_order: true, is_active: true },
  })
  if (!existing) throw new ApiTaxonomyError('NOT_FOUND', 404)

  // Un POI référence obligatoirement une catégorie : on refuse de supprimer une catégorie
  // encore utilisée par des POI actifs (sinon orphelins). L'admin les supprime/déplace d'abord.
  const activePoiCount = await prisma.pointOfInterest.count({
    where: { category_id: id, is_active: true, deleted_at: null },
  })
  if (activePoiCount > 0) {
    throw new ApiTaxonomyError('CATEGORY_HAS_POIS', 409, { poi_count: activePoiCount })
  }

  const now = new Date()
  await prisma.$transaction(async tx => {
    // Cascade : les sous-catégories de la catégorie supprimée sont soft-deleted avec elle.
    await tx.subCategory.updateMany({
      where: { category_id: id, deleted_at: null },
      data: { deleted_at: now, is_active: false },
    })

    const category = await tx.category.update({
      where: { id },
      data: { deleted_at: now, is_active: false },
      select: { id: true, name: true, slug: true, icon: true, sort_order: true, is_active: true },
    })

    await createAuditLog(tx, {
      adminId,
      action: 'category_deleted',
      targetType: 'category',
      targetId: id,
      before: categoryAuditPayload(existing),
      after: categoryAuditPayload(category),
    })
  })

  return { id, deleted: true }
}

export async function deleteSubCategory(id: string, adminId: string): Promise<{ id: string; deleted: true }> {
  const existing = await prisma.subCategory.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, category_id: true, name: true, slug: true, sort_order: true, is_active: true },
  })
  if (!existing) throw new ApiTaxonomyError('NOT_FOUND', 404)

  const activePoiCount = await prisma.pointOfInterest.count({
    where: { subcategory_id: id, is_active: true, deleted_at: null },
  })
  if (activePoiCount > 0) {
    throw new ApiTaxonomyError('SUBCATEGORY_HAS_POIS', 409, { poi_count: activePoiCount })
  }

  const now = new Date()
  await prisma.$transaction(async tx => {
    const subcategory = await tx.subCategory.update({
      where: { id },
      data: { deleted_at: now, is_active: false },
      select: { id: true, category_id: true, name: true, slug: true, sort_order: true, is_active: true },
    })

    await createAuditLog(tx, {
      adminId,
      action: 'subcategory_deleted',
      targetType: 'subcategory',
      targetId: id,
      before: subCategoryAuditPayload(existing),
      after: subCategoryAuditPayload(subcategory),
    })
  })

  return { id, deleted: true }
}

async function getCategoryById(id: string): Promise<AdminCategory> {
  const category = await prisma.category.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sort_order: true,
      is_active: true,
      _count: {
        select: {
          pois: { where: { is_active: true, deleted_at: null } },
        },
      },
      subcategories: {
        where: { deleted_at: null },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          category_id: true,
          name: true,
          slug: true,
          sort_order: true,
          is_active: true,
          _count: {
            select: {
              pois: { where: { is_active: true, deleted_at: null } },
            },
          },
        },
      },
    },
  })

  if (!category) throw new ApiTaxonomyError('NOT_FOUND', 404)
  const row = category as CategoryRow
  return mapCategory(row, await getTaxonomyLockMaps([row]))
}

function mapCategory(category: CategoryRow, locks: TaxonomyLockMaps): AdminCategory {
  const subcategories = category.subcategories.map(subcategory => mapSubCategory(subcategory, locks))
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    sort_order: category.sort_order,
    is_active: category.is_active,
    slug_locked: locks.categoryLocks.has(category.id),
    poi_count: category._count.pois,
    subcategory_count: subcategories.length,
    subcategories,
  }
}

function mapSubCategory(
  subcategory: CategoryRow['subcategories'][number],
  locks: TaxonomyLockMaps,
): AdminSubCategory {
  return {
    id: subcategory.id,
    category_id: subcategory.category_id,
    name: subcategory.name,
    slug: subcategory.slug,
    sort_order: subcategory.sort_order,
    is_active: subcategory.is_active,
    slug_locked: locks.subCategoryLocks.has(subcategory.id),
    poi_count: subcategory._count.pois,
  }
}

async function getTaxonomyLockMaps(categories: CategoryRow[]): Promise<TaxonomyLockMaps> {
  const categoryIds = categories.map(category => category.id)
  const categorySlugs = categories.map(category => category.slug)
  const subCategoryIds = categories.flatMap(category => category.subcategories.map(subcategory => subcategory.id))

  if (categoryIds.length === 0 && subCategoryIds.length === 0) {
    return { categoryLocks: new Set(), subCategoryLocks: new Set() }
  }

  const [
    activePoiByCategory,
    activePoiBySubCategory,
    geminiCacheByCategory,
    cacheConfigs,
    customizations,
    analyticsByCategory,
  ] = await Promise.all([
    categoryIds.length > 0
      ? prisma.pointOfInterest.groupBy({
          by: ['category_id'],
          where: { category_id: { in: categoryIds }, is_active: true, deleted_at: null },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    subCategoryIds.length > 0
      ? prisma.pointOfInterest.groupBy({
          by: ['subcategory_id'],
          where: { subcategory_id: { in: subCategoryIds }, is_active: true, deleted_at: null },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    categoryIds.length > 0
      ? prisma.geminiCache.groupBy({
          by: ['category_id'],
          where: { category_id: { in: categoryIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    categorySlugs.length > 0
      ? prisma.cacheTtlConfig.findMany({
          where: { category_slug: { in: categorySlugs } },
          select: { category_slug: true },
        })
      : Promise.resolve([]),
    categorySlugs.length > 0
      ? prisma.lodgingCustomization.findMany({
          where: { deleted_at: null, category_order: { hasSome: categorySlugs } },
          select: { category_order: true },
        })
      : Promise.resolve([]),
    categoryIds.length > 0
      ? prisma.analytics.groupBy({
          by: ['category_id'],
          where: { category_id: { in: categoryIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ])

  const categoryLocks = new Set<string>()
  const subCategoryLocks = new Set<string>()
  const slugToId = new Map(categories.map(category => [category.slug, category.id]))

  for (const row of activePoiByCategory) categoryLocks.add(row.category_id)
  for (const row of geminiCacheByCategory) categoryLocks.add(row.category_id)
  for (const row of analyticsByCategory) {
    if (row.category_id) categoryLocks.add(row.category_id)
  }
  for (const row of cacheConfigs) {
    const categoryId = slugToId.get(row.category_slug)
    if (categoryId) categoryLocks.add(categoryId)
  }
  for (const customization of customizations) {
    for (const slug of customization.category_order) {
      const categoryId = slugToId.get(slug)
      if (categoryId) categoryLocks.add(categoryId)
    }
  }
  for (const row of activePoiBySubCategory) {
    if (row.subcategory_id) subCategoryLocks.add(row.subcategory_id)
  }

  return { categoryLocks, subCategoryLocks }
}

async function assertCategorySlugAvailable(slug: string, ignoreId?: string): Promise<void> {
  const existing = await prisma.category.findFirst({
    where: {
      slug,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  })
  if (existing) throw new ApiTaxonomyError('SLUG_ALREADY_EXISTS', 409)
}

async function assertSubCategorySlugAvailable(slug: string, ignoreId?: string): Promise<void> {
  const existing = await prisma.subCategory.findFirst({
    where: {
      slug,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  })
  if (existing) throw new ApiTaxonomyError('SLUG_ALREADY_EXISTS', 409)
}

function categoryAuditPayload(category: {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
}): AuditPayload {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    sort_order: category.sort_order,
    is_active: category.is_active,
  }
}

function subCategoryAuditPayload(subcategory: {
  id: string
  category_id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}): AuditPayload {
  return {
    id: subcategory.id,
    category_id: subcategory.category_id,
    name: subcategory.name,
    slug: subcategory.slug,
    sort_order: subcategory.sort_order,
    is_active: subcategory.is_active,
  }
}

async function createAuditLog(
  tx: Prisma.TransactionClient,
  input: {
    adminId: string
    action: string
    targetType: string
    targetId: string | null
    before: AuditPayload | null
    after: AuditPayload | null
  },
): Promise<void> {
  await tx.taxonomyChangeLog.create({
    data: {
      admin_id: input.adminId,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      before: input.before ?? Prisma.JsonNull,
      after: input.after ?? Prisma.JsonNull,
    },
  })
}
