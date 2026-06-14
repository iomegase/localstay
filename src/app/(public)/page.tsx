import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'
import { listActiveCities } from '@/features/city-guide/queries/cities'
import { t } from '@/shared/lib/i18n'
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

  return await AnonymousLanding()
}

async function AnonymousLanding() {
  const cities = await listActiveCities()

  return (
    <AppShell>
      <BrandMotionStyles />

      <header className="relative z-20 flex items-center justify-between px-6 pt-6">
        {/* <BrandLogo /> */}
      </header>

      <main className="relative z-10 flex-1 px-6 pb-28 pt-10">
        <FloatingAura className="left-[-90px] top-24 h-64 w-64 bg-[#007AFF]/18" />
        <FloatingAura className="right-[-110px] top-20 h-72 w-72 bg-[#AF52DE]/16 delay-500" />

        <h1 className="max-w-[330px] text-[3.05rem] font-semibold leading-[0.92] tracking-[-0.06em] text-charcoal">
          {t('home.title')}
        </h1>

        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#6E6E73]">
          {t('home.intro')}
        </p>

        <div className="mt-8">
          <CityCategoryExplorer cities={cities} />
        </div>
      </main>
    </AppShell>
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
    <AppShell>
      <BrandMotionStyles />

      <header className="relative z-20 flex items-center justify-between px-6 pt-6">
        {/* <BrandLogo /> */}

        <Link
          href="/contact"
          className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/64 text-[#1D1D1F] shadow-[0_12px_40px_rgba(29,29,31,0.08)] backdrop-blur-2xl transition-transform hover:scale-105 active:scale-95"
        >
          ?
        </Link>
      </header>

      <main className="relative z-10 flex-1 px-5 pb-32 pt-6">
        <FloatingAura className="left-[-90px] top-14 h-64 w-64 bg-[#34C759]/16" />
        <FloatingAura className="right-[-120px] top-64 h-72 w-72 bg-[#007AFF]/15 delay-700" />
        <FloatingAura className="bottom-20 left-10 h-56 w-56 bg-[#FF9500]/16 delay-1000" />

        <section className="mystay-card relative overflow-hidden rounded-[2.75rem] bg-[#1D1D1F] p-4 text-white shadow-[0_34px_100px_rgba(29,29,31,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_8%,rgba(0,122,255,0.72),transparent_34%),radial-gradient(circle_at_10%_92%,rgba(255,149,0,0.42),transparent_40%)]" />

          {coverPhotoUrl && (
            <div className="absolute inset-0 opacity-52">
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
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,29,31,0.08),rgba(29,29,31,0.82))]" />
            </div>
          )}

          {!coverPhotoUrl && (
            <>
              {/* TODO: si une image par défaut existe dans /public, remplacer ce fond gradient par un composant Image. */}
              <FloatingAura className="right-[-80px] top-[-60px] h-52 w-52 bg-[#007AFF]/55" />
              <FloatingAura className="bottom-[-90px] left-[-70px] h-56 w-56 bg-[#AF52DE]/35 delay-500" />
            </>
          )}

          <div className="relative flex min-h-[340px] flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/68">
                Votre séjour
              </p>

              <h1 className="mt-4 max-w-[315px] text-[3.35rem] font-semibold uppercase leading-[0.86] tracking-[-0.08em]">
                {lodgingName}
              </h1>

              <p className="mt-3 text-sm font-medium text-white/78">{cityName}</p>
            </div>

            {welcomeMessage && welcomeMessage.trim() !== '' && (
              <div className="rounded-[1.8rem] border border-white/16 bg-white/14 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[26px]">
                <p className="text-sm italic leading-relaxed text-white/88">
                  « {welcomeMessage} »
                </p>
              </div>
            )}
          </div>
        </section>

        <Link
          href={`/guide/${citySlug}`}
          className="mystay-card mt-5 flex items-center justify-between rounded-full bg-[#007AFF] px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_24px_60px_rgba(0,122,255,0.26)]"
        >
          <span>Découvrir le guide</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xl">
            →
          </span>
        </Link>

        <section className="mt-6 grid grid-cols-4 gap-4">
          <ShortcutCard
            className="col-span-2 row-span-2"
            href="/le-logement"
            eyebrow="Host notes"
            title="Le logement"
            subtitle="Wi-Fi, parking, équipements"
            count="Infos utiles"
            tone="white"
            tall
          />

          <ShortcutCard
            className="col-span-2"
            href="/nos-recommandations"
            eyebrow="Sélection"
            title={recommendationsTitle}
            subtitle="Restaurants, sorties, lieux favoris"
            count="À découvrir"
            tone="blue"
          />

          <ShortcutCard
            className="col-span-2"
            href="/mes-favoris"
            eyebrow="Vos choix"
            title="Vos favoris"
            subtitle="Lieux sauvegardés"
            count="Favoris"
            tone="pink"
          />

          <ShortcutCard
            className="col-span-4"
            href="/contact"
            eyebrow="Assistance"
            title="Nous contacter"
            subtitle="Une question pendant votre séjour ?"
            count="Contact"
            tone="green"
          />
        </section>
      </main>

      <LodgingBottomBar citySlug={citySlug} />
    </AppShell>
  )
}

type BentoTone = 'white' | 'blue' | 'green' | 'pink' | 'orange' | 'dark'

function ShortcutCard({
  href,
  eyebrow,
  title,
  subtitle,
  count,
  tone = 'white',
  tall = false,
  className = '',
}: {
  href: string
  eyebrow: string
  title: string
  subtitle: string
  count: string
  tone?: BentoTone
  tall?: boolean
  className?: string
}) {
  const toneClass = {
    white:
      'border-white/70 bg-white/68 text-[#1D1D1F] shadow-[0_18px_55px_rgba(29,29,31,0.08)]',
    blue:
      'border-transparent bg-[#007AFF] text-white shadow-[0_22px_65px_rgba(0,122,255,0.22)]',
    green:
      'border-transparent bg-[#34C759] text-white shadow-[0_22px_65px_rgba(52,199,89,0.20)]',
    pink:
      'border-transparent bg-[#FF2D55] text-white shadow-[0_22px_65px_rgba(255,45,85,0.20)]',
    orange:
      'border-transparent bg-[#FF9500] text-white shadow-[0_22px_65px_rgba(255,149,0,0.20)]',
    dark:
      'border-transparent bg-[#1D1D1F] text-white shadow-[0_22px_65px_rgba(29,29,31,0.24)]',
  }[tone]

  const isLight = tone === 'white'

  return (
    <Link
      href={href}
      className={`mystay-card group relative overflow-hidden rounded-[2.25rem] border p-4 backdrop-blur-[30px] ${toneClass} ${
        tall ? 'min-h-[240px]' : 'min-h-[165px]'
      } ${className}`}
    >
      <FloatingAura
        className={
          isLight
            ? 'right-[-55px] top-[-52px] h-36 w-36 bg-[#007AFF]/12'
            : 'right-[-55px] top-[-52px] h-36 w-36 bg-white/22'
        }
      />

      <div className="relative flex h-full flex-col justify-between">
        <div>
          <p
            className={`text-[9px] font-semibold uppercase tracking-[0.26em] ${
              isLight ? 'text-[#007AFF]' : 'text-white/70'
            }`}
          >
            {eyebrow}
          </p>

          <h2 className="mt-3 text-xl font-semibold leading-tight tracking-[-0.06em]">
            {title}
          </h2>

          <p className={`mt-3 text-xs leading-relaxed ${isLight ? 'text-[#6E6E73]' : 'text-white/72'}`}>
            {subtitle}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className={`text-xs font-semibold ${isLight ? 'text-[#1D1D1F]' : 'text-white'}`}>
            {count}
          </span>

          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${
              isLight ? 'bg-[#F5F5F7] text-[#1D1D1F]' : 'bg-white/20 text-white'
            }`}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen ">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white">
        {children}
      </div>
    </div>
  )
}

// function BrandLogo() {
//   return (
//     <div className="flex items-center gap-3">
//       {/* TODO: si tu ajoutes le logo réel dans /public, remplacer ce logo HTML par <Image src="/logo-mystay.svg" ... />. */}
//       <div className="flex items-baseline gap-2 text-[30px] font-semibold uppercase leading-none tracking-[-0.075em]">
//         <span className="text-[#1D1D1F]">My</span>
//         <span className="text-[#007AFF]">Stay</span>
//       </div>
//     </div>
//   )
// }

function FloatingAura({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`mystay-elastic pointer-events-none absolute rounded-full blur-[18px] ${className}`}
    />
  )
}

function LodgingBottomBar({ citySlug }: { citySlug: string }) {
  return (
    <nav className="fixed bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 rounded-full border border-white/72 bg-white/70 p-2 shadow-[0_18px_60px_rgba(29,29,31,0.16)] backdrop-blur-[32px]">
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-[#6E6E73]">
        <Link
          href={`/guide/${citySlug}`}
          className="flex items-center justify-center rounded-full bg-[#1D1D1F] px-3 py-3 text-white"
        >
          Guide
        </Link>

        <Link
          href="/le-logement"
          className="flex items-center justify-center rounded-full px-3 py-3 transition-colors hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
        >
          Séjour
        </Link>

        <Link
          href="/nos-recommandations"
          className="flex items-center justify-center rounded-full px-3 py-3 transition-colors hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
        >
          Notes
        </Link>
      </div>
    </nav>
  )
}

function BrandMotionStyles() {
  return (
    <style>
      {`
        @keyframes mystayElasticFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          35% {
            transform: translate3d(12px, -14px, 0) scale(1.08);
          }
          70% {
            transform: translate3d(-8px, 10px, 0) scale(0.96);
          }
        }

        .mystay-elastic {
          animation: mystayElasticFloat 9s cubic-bezier(.2,.8,.2,1) infinite;
          transform-origin: center;
        }

        .mystay-card {
          transition:
            transform 520ms cubic-bezier(.18, 1.25, .32, 1),
            box-shadow 520ms cubic-bezier(.18, 1.25, .32, 1),
            border-color 520ms cubic-bezier(.18, 1.25, .32, 1);
        }

        .mystay-card:hover {
          transform: translateY(-5px) scale(1.012);
        }

        .mystay-card:active {
          transform: scale(.965);
        }

        @media (prefers-reduced-motion: reduce) {
          .mystay-elastic,
          .mystay-card {
            animation: none;
            transition: none;
          }

          .mystay-card:hover,
          .mystay-card:active {
            transform: none;
          }
        }
      `}
    </style>
  )
}