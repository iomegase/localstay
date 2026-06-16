import { z } from 'zod'
import { normalizeBlogSlug } from './lib/slug'
import { BLOG_ARTICLE_CATEGORIES } from './types'

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function normalizeOptionalBlogSlug(input: string): string {
  const trimmed = input.trim()
  if (trimmed === '') return ''

  const normalized = normalizeBlogSlug(trimmed)
  const alphanumericSource = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalized === 'article' && !/[a-z0-9]/i.test(alphanumericSource)) {
    return ''
  }

  return normalized
}

function optionalDraftTextSchema(min: number, max: number, label: string) {
  return z.string()
    .trim()
    .max(max, `${label} doit contenir entre ${min} et ${max} caractères.`)
    .optional()
    .default('')
    .refine(
      value => value.length === 0 || value.length >= min,
      `${label} doit contenir entre ${min} et ${max} caractères.`,
    )
}

function optionalNullableBoundedTextSchema(min: number, max: number, label: string) {
  return z.union([z.string(), z.null(), z.undefined()])
    .transform(value => {
      if (typeof value !== 'string') return null

      const trimmed = value.trim()
      return trimmed === '' ? null : trimmed
    })
    .refine(
      value => value === null || (value.length >= min && value.length <= max),
      `${label} doit contenir entre ${min} et ${max} caractères.`,
    )
}

const DraftBlogSlugSchema = z.string()
  .trim()
  .max(120, 'Le slug doit contenir entre 3 et 120 caractères.')
  .optional()
  .default('')
  .transform(normalizeOptionalBlogSlug)
  .refine(
    value => value === '' || (value.length >= 3 && value.length <= 120),
    'Le slug doit contenir entre 3 et 120 caractères.',
  )

export const BlogArticleUpsertSchema = z.object({
  title: optionalDraftTextSchema(5, 90, 'Le titre'),
  slug: DraftBlogSlugSchema,
  excerpt: optionalDraftTextSchema(40, 220, 'L’extrait'),
  content_markdown: z.string().trim().max(20000).optional().default(''),
  category: z.enum(BLOG_ARTICLE_CATEGORIES),
  tags: z.array(z.string().trim().max(40)).max(10).default([]).transform(tags => {
    const seen = new Set<string>()
    return tags
      .map(normalizeTag)
      .filter(tag => tag.length > 0)
      .filter(tag => {
        if (seen.has(tag)) return false
        seen.add(tag)
        return true
      })
      .slice(0, 10)
  }),
  city_id: z.string().uuid().nullable().optional().transform(value => value ?? null),
  seo_title: optionalNullableBoundedTextSchema(30, 70, 'Le SEO title'),
  seo_description: optionalNullableBoundedTextSchema(80, 180, 'La meta description'),
})

export const BlogGenerateSchema = z.object({
  brief: z.string().trim().min(20).max(4000),
  verified_facts: z.string().trim().max(8000).optional().default(''),
})

export const BlogApplyGenerationSchema = z.object({
  generation_id: z.string().uuid(),
})

export const BlogAdminFiltersSchema = z.object({
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  category: z.enum(BLOG_ARTICLE_CATEGORIES).optional(),
  city: z.string().optional(),
})

export const BlogPhotoUploadSchema = z.object({
  kind: z.enum(['cover', 'gallery']),
  alt: z.string({ required_error: 'Le texte alternatif est requis.' })
    .trim()
    .min(3, 'Le texte alternatif doit contenir au moins 3 caractères.')
    .max(180, 'Le texte alternatif doit contenir au maximum 180 caractères.'),
  sort_order: z.coerce.number({ invalid_type_error: 'L’ordre de tri doit être numérique.' })
    .int('L’ordre de tri doit être un entier.')
    .min(0, 'L’ordre de tri doit être positif ou nul.')
    .optional()
    .default(0),
})

export type BlogArticleUpsertInput = z.infer<typeof BlogArticleUpsertSchema>
export type BlogGenerateInput = z.infer<typeof BlogGenerateSchema>
export type BlogApplyGenerationInput = z.infer<typeof BlogApplyGenerationSchema>
export type BlogAdminFiltersInput = z.infer<typeof BlogAdminFiltersSchema>
export type BlogPhotoUploadInput = z.infer<typeof BlogPhotoUploadSchema>
