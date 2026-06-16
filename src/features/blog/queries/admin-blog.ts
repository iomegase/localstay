import { prisma } from '@/shared/lib/prisma'
import { ZodError } from 'zod'
import { getBlogPublishValidationErrors } from '../lib/publish-validation'
import { generateBlogDraftWithGemini } from '../services/gemini-draft'
import type {
  BlogAdminFiltersInput,
  BlogArticleUpsertInput,
  BlogGenerateInput,
  BlogPhotoUploadInput,
} from '../schemas'

export class ApiBlogError extends Error {
  code: string
  status: number
  details: Record<string, unknown>

  constructor(code: string, status: number, details: Record<string, unknown> = {}, message = code) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
    this.name = 'ApiBlogError'
  }
}

function toAdminListItem(article: {
  id: string
  title: string
  slug: string
  status: 'draft' | 'review' | 'published' | 'archived'
  category: string
  published_at: Date | null
  updated_at: Date
  city: { name: string } | null
}) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    status: article.status,
    category: article.category,
    city_name: article.city?.name ?? null,
    published_at: article.published_at?.toISOString() ?? null,
    updated_at: article.updated_at.toISOString(),
  }
}

export async function listAdminBlogArticles(filters: BlogAdminFiltersInput) {
  const articles = await prisma.blogArticle.findMany({
    where: {
      deleted_at: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.city ? { city_id: filters.city } : {}),
    },
    orderBy: [{ updated_at: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      published_at: true,
      updated_at: true,
      city: { select: { name: true } },
    },
  })

  return articles.map(toAdminListItem)
}

export async function listBlogAdminCities() {
  return prisma.city.findMany({
    where: { is_active: true, deleted_at: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export async function createBlogArticle(input: BlogArticleUpsertInput, adminId: string) {
  const article = await prisma.blogArticle.create({
    data: {
      ...input,
      author_admin_id: adminId,
      status: 'draft',
    },
    select: {
      id: true,
      status: true,
      slug: true,
    },
  })

  return article
}

export async function getAdminBlogArticle(id: string) {
  return prisma.blogArticle.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content_markdown: true,
      category: true,
      tags: true,
      status: true,
      published_at: true,
      updated_at: true,
      city_id: true,
      city: { select: { name: true } },
      seo_title: true,
      seo_description: true,
      photos: {
        where: { deleted_at: null },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        select: { id: true, kind: true, url: true, alt: true, sort_order: true },
      },
    },
  })
}

export async function updateBlogArticle(id: string, input: BlogArticleUpsertInput) {
  try {
    const article = await prisma.blogArticle.update({
      where: { id },
      data: input,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        category: true,
        published_at: true,
        updated_at: true,
        city: { select: { name: true } },
        excerpt: true,
        content_markdown: true,
        tags: true,
        seo_title: true,
        seo_description: true,
        photos: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: { id: true, kind: true, url: true, alt: true, sort_order: true },
        },
      },
    })

    return {
      ...toAdminListItem(article),
      excerpt: article.excerpt,
      content_markdown: article.content_markdown,
      tags: article.tags,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      photos: article.photos,
    }
  } catch {
    throw new ApiBlogError('NOT_FOUND', 404)
  }
}

export async function submitBlogArticleForReview(id: string) {
  try {
    return await prisma.blogArticle.update({
      where: { id },
      data: { status: 'review', submitted_for_review_at: new Date() },
      select: { id: true, status: true, slug: true },
    })
  } catch {
    throw new ApiBlogError('NOT_FOUND', 404)
  }
}

export async function publishBlogArticle(id: string) {
  const article = await prisma.blogArticle.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content_markdown: true,
      seo_title: true,
      seo_description: true,
      city: { select: { is_active: true, deleted_at: true } },
      photos: {
        where: { deleted_at: null, kind: 'cover' },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        select: { alt: true },
        take: 1,
      },
    },
  })

  if (!article) throw new ApiBlogError('NOT_FOUND', 404)

  const errors = getBlogPublishValidationErrors({
    title: article.title,
    excerpt: article.excerpt,
    content_markdown: article.content_markdown,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    city: article.city,
    coverPhoto: article.photos[0] ?? null,
  })

  if (errors.length > 0) {
    throw new ApiBlogError('PUBLISH_REQUIREMENTS', 400, { fields: errors })
  }

  return prisma.blogArticle.update({
    where: { id },
    data: {
      status: 'published',
      published_at: new Date(),
      archived_at: null,
    },
    select: { id: true, status: true, slug: true },
  })
}

export async function archiveBlogArticle(id: string) {
  try {
    return await prisma.blogArticle.update({
      where: { id },
      data: {
        status: 'archived',
        archived_at: new Date(),
      },
      select: { id: true, status: true, slug: true },
    })
  } catch {
    throw new ApiBlogError('NOT_FOUND', 404)
  }
}

export async function deleteBlogArticle(id: string) {
  try {
    return await prisma.blogArticle.update({
      where: { id },
      data: { deleted_at: new Date() },
      select: { id: true, slug: true },
    })
  } catch {
    throw new ApiBlogError('NOT_FOUND', 404)
  }
}

export async function createBlogPhoto(articleId: string, input: BlogPhotoUploadInput & { url: string }) {
  const article = await prisma.blogArticle.findFirst({
    where: { id: articleId, deleted_at: null },
    select: { id: true },
  })
  if (!article) throw new ApiBlogError('NOT_FOUND', 404)

  if (input.kind === 'cover') {
    await prisma.blogArticlePhoto.updateMany({
      where: {
        article_id: articleId,
        kind: 'cover',
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    })
  }

  return prisma.blogArticlePhoto.create({
    data: {
      article_id: articleId,
      kind: input.kind,
      url: input.url,
      alt: input.alt,
      sort_order: input.sort_order,
    },
    select: { id: true, kind: true, url: true, alt: true, sort_order: true },
  })
}

export async function generateBlogDraft(articleId: string, input: BlogGenerateInput, adminId: string) {
  const article = await prisma.blogArticle.findFirst({
    where: { id: articleId, deleted_at: null },
    select: {
      id: true,
      city: { select: { name: true, slug: true } },
    },
  })
  if (!article) throw new ApiBlogError('NOT_FOUND', 404)

  const sourceHash = Buffer.from(`${input.brief}\n${input.verified_facts}`).toString('base64')

  try {
    const suggestion = await generateBlogDraftWithGemini({
      brief: input.brief,
      verifiedFacts: input.verified_facts,
      cityContext: article.city,
    })

    const createdDraft = await prisma.blogGenerationDraft.create({
      data: {
        article_id: articleId,
        admin_id: adminId,
        provider: 'gemini',
        status: 'generated',
        source_hash: sourceHash,
        brief: input.brief,
        verified_facts: input.verified_facts,
        city_context: article.city ?? undefined,
        generated_at: new Date(),
        suggestion_title: suggestion.draft.title,
        suggestion_excerpt: suggestion.draft.excerpt,
        suggestion_markdown: suggestion.draft.content_markdown,
        suggestion_seo_title: suggestion.draft.seo_title,
        suggestion_seo_description: suggestion.draft.seo_description,
      },
      select: {
        id: true,
        status: true,
        provider: true,
        suggestion_title: true,
        suggestion_excerpt: true,
        suggestion_markdown: true,
        suggestion_seo_title: true,
        suggestion_seo_description: true,
      },
    })

    return {
      ...createdDraft,
      text: createdDraft.suggestion_markdown ?? '',
      sources: suggestion.sources,
    }
  } catch (error) {
    if (error instanceof ApiBlogError) throw error

    if (error instanceof ZodError) {
      throw new ApiBlogError(
        'GEMINI_INVALID_RESPONSE',
        502,
        { fieldErrors: error.flatten().fieldErrors },
        'La proposition Gemini reçue est invalide.',
      )
    }

    const code =
      typeof (error as { code?: unknown })?.code === 'string'
        ? (error as { code: string }).code
        : error instanceof Error
          ? error.message
          : 'GEMINI_UNAVAILABLE'
    const status =
      typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : code === 'FORBIDDEN_SCOPE'
          ? 400
          : 503

    if (code === 'FORBIDDEN_SCOPE') {
      throw new ApiBlogError(
        'FORBIDDEN_SCOPE',
        400,
        {
          fieldErrors: {
            brief: ['Le brief ou les faits vérifiés sortent du périmètre Gemini autorisé.'],
            verified_facts: ['Le brief ou les faits vérifiés sortent du périmètre Gemini autorisé.'],
          },
        },
        'Le brief Gemini contient une demande hors périmètre.',
      )
    }

    throw new ApiBlogError(
      code,
      status,
      {},
      code === 'GEMINI_UNAVAILABLE' ? 'Gemini indisponible' : 'Erreur Gemini',
    )
  }
}

export async function applyBlogGeneration(articleId: string, generationId: string) {
  const generation = await prisma.blogGenerationDraft.findFirst({
    where: {
      id: generationId,
      article_id: articleId,
      deleted_at: null,
    },
    select: {
      id: true,
      suggestion_title: true,
      suggestion_excerpt: true,
      suggestion_markdown: true,
      suggestion_seo_title: true,
      suggestion_seo_description: true,
    },
  })

  if (!generation) throw new ApiBlogError('NOT_FOUND', 404)

  await prisma.blogGenerationDraft.update({
    where: { id: generation.id },
    data: { status: 'accepted' },
  })

  return prisma.blogArticle.update({
    where: { id: articleId },
    data: {
      title: generation.suggestion_title ?? undefined,
      excerpt: generation.suggestion_excerpt ?? undefined,
      content_markdown: generation.suggestion_markdown ?? undefined,
      seo_title: generation.suggestion_seo_title ?? undefined,
      seo_description: generation.suggestion_seo_description ?? undefined,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      published_at: true,
      updated_at: true,
      city: { select: { name: true } },
      excerpt: true,
      content_markdown: true,
      tags: true,
      seo_title: true,
      seo_description: true,
      photos: {
        where: { deleted_at: null },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        select: { id: true, kind: true, url: true, alt: true, sort_order: true },
      },
    },
  }).then(article => ({
    ...toAdminListItem(article),
    excerpt: article.excerpt,
    content_markdown: article.content_markdown,
    tags: article.tags,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    photos: article.photos,
  }))
}
