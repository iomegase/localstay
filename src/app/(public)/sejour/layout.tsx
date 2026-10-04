import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { guideManifestHref } from '@/features/guide-pwa/lib/manifest'
import { GuidePwaRuntime } from '@/features/guide-pwa/components/GuidePwaRuntime'
import { GuideI18nProvider } from '@/features/guide-i18n/components/GuideI18nProvider'
import { getGuideLocale } from '@/features/guide-i18n/lib/server-locale'
import { guideMessages } from '@/features/guide-i18n/messages'

// Spec 059 AC-01-01 : manifest propre au logement du séjour ; spec 061 : titre traduit.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getGuideLocale()
  const metadata = privatePageMetadata(guideMessages(locale).meta.stayTitle)
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) return metadata
  return { ...metadata, manifest: guideManifestHref(lodgingContext.lodgingId) }
}

export default async function SejourLayout({ children }: { children: React.ReactNode }) {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) return children

  return (
    <GuideI18nProvider initialLocale={await getGuideLocale()}>
      <GuidePwaRuntime lodgingId={lodgingContext.lodgingId}>{children}</GuidePwaRuntime>
    </GuideI18nProvider>
  )
}
