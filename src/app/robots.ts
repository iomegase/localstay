import type { MetadataRoute } from 'next'
import { siteBaseUrl } from '@/features/seo/lib/site'

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api', '/merchant'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
