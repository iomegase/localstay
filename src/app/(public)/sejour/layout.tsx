import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { guideManifestHref } from '@/features/guide-pwa/lib/manifest'
import { GuidePwaRuntime } from '@/features/guide-pwa/components/GuidePwaRuntime'

// Spec 059 AC-01-01 : manifest propre au logement du séjour.
export async function generateMetadata(): Promise<Metadata> {
  const metadata = privatePageMetadata('Votre séjour')
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) return metadata
  return { ...metadata, manifest: guideManifestHref(lodgingContext.lodgingId) }
}

export default async function SejourLayout({ children }: { children: React.ReactNode }) {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) return children

  return <GuidePwaRuntime lodgingId={lodgingContext.lodgingId}>{children}</GuidePwaRuntime>
}
