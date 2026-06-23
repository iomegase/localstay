import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'
import { listActiveCities, getCityGuide } from '@/features/city-guide/queries/cities'
import { CategoryBentoGrid } from '@/features/city-guide/components/CategoryBentoGrid'
import { t } from '@/shared/lib/i18n'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

type HomePageProps = {
  searchParams?: Promise<{ lodging?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps = {}) {
  // QR séjour : le proxy redirige le scan vers /?lodging=:id. La présence du
  // param marque un scan « frais » → on enregistre l'évènement qr_scan ici,
  // comme le faisait la page guide auparavant.
  const lodgingFromQuery = (await searchParams)?.lodging ?? null
  void recordQrScanIfPresent(lodgingFromQuery)

  const lodgingContext = await getActiveLodgingContext()

  if (lodgingContext) {
    return (
      <LodgingHome
        citySlug={lodgingContext.citySlug}
        lodgingId={lodgingContext.lodgingId}
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

     

      <main className="relative z-10 flex-1 px-6 pb-28 pt-10">
        <FloatingAura className="left-[-90px] top-24 h-64 w-64 bg-[#007AFF]/18" />
        <FloatingAura className="right-[-110px] top-20 h-72 w-72 bg-[#AF52DE]/16 delay-500" />

        <h1 className="max-w-[330px] text-6xl font-semibold leading-[0.92] tracking-[-0.06em] text-charcoal">
          {t('home.title')}
        </h1>

        <p className="mt-8 max-w-sm text-[12px] leading-relaxed text-[#6E6E73]">
          {t('home.intro')}
        </p>

        <div className="mt-8">
          <CityCategoryExplorer cities={cities} />
        </div>
      </main>
    </AppShell>
  )
}

export async function LodgingHome({
  citySlug,
  lodgingId,
}: {
  citySlug: string
  lodgingId: string
}) {
  const guide = await getCityGuide(citySlug, { lodgingId })
  const categories = guide?.categories ?? []

  return (
    <AppShell>
      <BrandMotionStyles />

      <main className="relative z-10 flex-1 px-6 pb-28 pt-10">
        <FloatingAura className="left-[-90px] top-24 h-64 w-64 bg-[#007AFF]/18" />
        <FloatingAura className="right-[-110px] top-20 h-72 w-72 bg-[#AF52DE]/16 delay-500" />

        <h1 className="max-w-[330px] text-6xl font-semibold leading-[0.92] tracking-[-0.06em] text-charcoal">
          {t('home.title')}
        </h1>

        <p className="mt-8 max-w-sm text-[12px] leading-relaxed text-[#6E6E73]">
          {t('home.intro')}
        </p>

        <div className="mt-8">
          {categories.length > 0 ? (
            <CategoryBentoGrid
              categories={categories}
              citySlug={citySlug}
              lodgingId={lodgingId}
            />
          ) : (
            <p className="mt-6 text-sm text-gray-500">{t('home.empty')}</p>
          )}
        </div>
      </main>
    </AppShell>
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