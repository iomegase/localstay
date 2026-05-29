import Link from 'next/link'
import { CitySearchInput } from '@/features/city-guide/components/CitySearchInput'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { prisma } from '@/shared/lib/prisma'

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
    <div className="flex flex-col items-center px-6 pt-12">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-light italic font-serif text-charcoal tracking-tight">
          MyStay
        </h1>
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-400">
          Le guide local de votre séjour
        </p>
      </div>
      <div className="w-full max-w-md space-y-3">
        <p className="text-center text-sm text-gray-500">Recherchez votre ville de résidence :</p>
        <CitySearchInput />
      </div>
      <p className="mt-12 max-w-sm text-center text-xs text-gray-400">
        Vous avez un QR code MyStay ? Scannez-le pour accéder au guide personnalisé de votre logement.
      </p>
    </div>
  )
}

function LodgingHome({
  citySlug,
  lodgingName,
  cityName,
  coverPhotoUrl,
  welcomeMessage,
}: {
  citySlug: string
  lodgingName: string
  cityName: string
  coverPhotoUrl: string | null
  welcomeMessage: string | null
}) {
  return (
    <div className="flex flex-col items-center px-6 pt-2">
      {coverPhotoUrl && (
        <div className="-mx-6 mb-6 w-[calc(100%+3rem)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverPhotoUrl}
            alt={lodgingName}
            referrerPolicy="no-referrer"
            className="h-56 w-full object-cover"
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
          <ShortcutCard href="/services-prives" title="Services privés" subtitle="Recommandations de l'hôte" />
          <ShortcutCard href="/mes-favoris" title="Mes favoris" subtitle="Lieux sauvegardés" />
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
