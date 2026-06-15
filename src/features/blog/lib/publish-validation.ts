function hasLength(value: string | null | undefined, min: number): boolean {
  return typeof value === 'string' && value.trim().length >= min
}

export function getBlogPublishValidationErrors(input: {
  title: string
  excerpt: string
  content_markdown: string
  seo_title: string | null
  seo_description: string | null
  city: { is_active: boolean; deleted_at: Date | null } | null
  coverPhoto: { alt: string } | null
}): string[] {
  const errors: string[] = []

  if (!hasLength(input.title, 5)) errors.push('title')
  if (!hasLength(input.excerpt, 40)) errors.push('excerpt')
  if (!hasLength(input.content_markdown, 300)) errors.push('content_markdown')
  if (!hasLength(input.seo_title, 30)) errors.push('seo_title')
  if (!hasLength(input.seo_description, 80)) errors.push('seo_description')
  if (!input.coverPhoto || !hasLength(input.coverPhoto.alt, 3)) errors.push('cover_photo')

  if (input.city && (!input.city.is_active || input.city.deleted_at !== null)) {
    errors.push('city_id')
  }

  return errors
}
