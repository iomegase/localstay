import type { MetadataRoute } from 'next'
import rootManifest from '@/app/manifest'
import { SITE } from '@/features/seo/lib/site'

/** Spec 059 AC-01-01 : l'app installée rouvre toujours le séjour de ce logement. */
export function pwaStartUrl(lodgingId: string): string {
  return `/sejour?lodging=${lodgingId}&source=pwa`
}

export function guideManifestHref(lodgingId: string): string {
  return `/api/guide/manifest?lodging=${lodgingId}`
}

export function buildLodgingManifest({
  lodgingId,
  lodgingName,
}: {
  lodgingId: string
  lodgingName: string
}): MetadataRoute.Manifest {
  const root = rootManifest()
  const startUrl = pwaStartUrl(lodgingId)

  return {
    ...root,
    id: startUrl,
    name: `${SITE.name} — ${lodgingName}`,
    short_name: SITE.name,
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
  }
}
