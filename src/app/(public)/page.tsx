import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CitySearchInput } from '@/features/city-guide/components/CitySearchInput'
import { QrScannerButton } from '@/features/public-menu/components/QrScannerButton'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { prisma } from '@/shared/lib/prisma'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const lodgingContext = await getActiveLodgingContext()

  if (lodgingContext) {
    const customization = await prisma.lodgingCustomization.findFirst({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      select: { cover_photo_url: true, welcome_message: true },
    })
    return (
      <LodgingHome
        citySlug={lodgingContext.citySlug}
        lodgingName={lodgingContext.lodgingName}
        ownerName={lodgingContext.ownerName}
        cityName={lodgingContext.cityName}
        coverPhotoUrl={customization?.cover_photo_url ?? null}
        welcomeMessage={customization?.welcome_message ?? null}
      />
    )
  }

  return <AnonymousLanding />
}

function AnonymousLanding() {
  return (
    <div className="flex flex-col h-screen bg-ivory">
      {/* Header */}


      {/* Main Content */}
      <main className="flex-1 px-6 pt-8 pb-32 flex flex-col">
        <div>
          <h2 className="text-2xl font-light uppercase text-charcoal leading-tight mb-8">
            My Stay <br />
            vous guide durant  <br />
            
          </h2>
          <span className="text-4xl uppercase font-thin text-gray-400">séjour&nbsp;</span>

          {/* Search */}
          <div className="mb-6 mt-16">
            <CitySearchInput />
          </div>

          {/* QR Code Scanner */}
          <div className="mt-[70px]">
            <QrScannerButton />
          </div>
        </div>
      </main>
    </div>
  )
}

function LodgingHome({
  citySlug,
  lodgingName,
  ownerName,
  cityName,
  coverPhotoUrl,
  welcomeMessage,
}: {
  citySlug: string
  lodgingName: string
  ownerName: string | null
  cityName: string
  coverPhotoUrl: string | null
  welcomeMessage: string | null
}) {
  const recommendationsTitle = ownerName
    ? `Les recommandations de ${ownerName}`
    : 'Les recommandations de votre hôte'

  return (
    <div className="flex flex-col items-center px-6 pt-2">
      {coverPhotoUrl && (
        <div className="relative -mx-6 mb-6 h-56 w-[calc(100%+3rem)] overflow-hidden">
          <Image
            src={coverPhotoUrl}
            alt={lodgingName}
            fill
            priority
            unoptimized
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        </div>
      )}
      <div className="mb-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Votre séjour</p>
        <h1 className="mt-2 font-serif italic text-3xl text-charcoal">{lodgingName}</h1>
        <p className="mt-1 text-sm text-gray-500">{cityName}</p>
        {welcomeMessage && welcomeMessage.trim() !== '' && (
          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-charcoal/70 italic">
            « {welcomeMessage} »
          </p>
        )}
      </div>

      <Link
        href={`/guide/${citySlug}`}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-charcoal px-8 py-4 text-[12px] font-bold uppercase tracking-widest text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
      >
        Découvrir le guide
      </Link>

      <div className="mt-10 w-full max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <ShortcutCard href="/le-logement" title="Le logement" subtitle="Wi-Fi, parking, équipements" />
          <ShortcutCard href="/nos-recommandations" title={recommendationsTitle} subtitle="Sélection de l'hôte" />
          <ShortcutCard href="/mes-favoris" title="Vos favoris" subtitle="Lieux sauvegardés" />
          <ShortcutCard href="/contact" title="Nous contacter" subtitle="Une question ?" />
        </div>
      </div>
    </div>
  )
}

function ShortcutCard({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
    >
      <span className="font-serif italic text-base text-charcoal">{title}</span>
      <span className="text-[11px] text-gray-400">{subtitle}</span>
    </Link>
  )
}
