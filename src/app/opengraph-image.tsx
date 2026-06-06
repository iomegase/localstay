import { renderOgCardImage } from '@/features/seo/components/og-card-image'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/features/seo/lib/og-image'
import { SITE } from '@/features/seo/lib/site'

export const alt = SITE.defaultTitle
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// Image OG par défaut (héritée par toutes les pages sans image dédiée).
export default function Image() {
  return renderOgCardImage({ title: 'Le guide local de votre séjour' })
}
