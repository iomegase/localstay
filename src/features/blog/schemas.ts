import { z } from 'zod'
import { BLOG_ARTICLE_CATEGORIES } from './types'

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

export const BlogArticleUpsertSchema = z.object({
  title: z.string().trim().min(5).max(90),
  slug: z.string().trim().min(3).max(120),
  excerpt: z.string().trim().min(40).max(220),
  content_markdown: z.string().trim().min(0).max(20000),
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
  seo_title: z.string().trim().min(30).max(70).nullable().optional().transform(value => value ?? null),
  seo_description: z.string().trim().min(80).max(180).nullable().optional().transform(value => value ?? null),
})

export const BlogGenerateSchema = z.object({
  brief: z.string().trim().min(20).max(4000),
  verified_facts: z.string().trim().min(20).max(8000),
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
  alt: z.string().trim().min(3).max(180),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
})

export type BlogArticleUpsertInput = z.infer<typeof BlogArticleUpsertSchema>
export type BlogGenerateInput = z.infer<typeof BlogGenerateSchema>
export type BlogApplyGenerationInput = z.infer<typeof BlogApplyGenerationSchema>
export type BlogAdminFiltersInput = z.infer<typeof BlogAdminFiltersSchema>
export type BlogPhotoUploadInput = z.infer<typeof BlogPhotoUploadSchema>
