import type { LocalMarketingNavigation } from './marketing-navigation'
import Link from 'next/link'
import { UserRound } from 'lucide-react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'
import { MarketingMobileMenu } from './MarketingMobileMenu'
import { MarketingDesktopNav } from './MarketingDesktopNav'
import { marketingContainerClass } from './marketing-styles'

export function MarketingBrand({ light = false, linked = true }: { light?: boolean; linked?: boolean }) {
  const logo = (
    <MyStayLogo
      tone={light ? 'reversed' : 'standard'}
      alt="MyStay"
      className="h-auto w-[116px] object-contain sm:w-[132px] xl:w-[118px]"
      priority={!light}
      sizes="(min-width: 1280px) 118px, (min-width: 640px) 132px, 116px"
    />
  )
  return linked ? (
    <Link href="/" aria-label="MyStay — Accueil" className="inline-flex shrink-0 items-center">{logo}</Link>
  ) : <span className="inline-flex shrink-0 items-center">{logo}</span>
}

export function MarketingHeader({ localNavigation }: { localNavigation?: LocalMarketingNavigation } = {}) {
  return (
    <header className="relative z-[80] mb-2.5 bg-white py-1 md:mb-[clamp(14px,1.6vw,24px)] md:py-[clamp(6px,0.7vw,10px)] lg:mt-[30px]">
      <div
        className={`${marketingContainerClass} flex h-[72px] items-center gap-4 md:h-[76px] xl:h-[62px] xl:gap-[14px]`}
      >
        {/* Logo décalé (~30 px gauche/haut) sur desktop pour aérer le menu (spec 031 AC-01-07). */}
        <span data-testid="marketing-header-brand" className="inline-flex lg:-translate-x-[30px] lg:-translate-y-[30px]">
          <MarketingBrand linked={!localNavigation} />
        </span>

        <MarketingDesktopNav localNavigation={localNavigation} />

        <Link
          href="/auth/login"
          aria-label="Se connecter à l’espace propriétaire"
          title="Se connecter"
          className="ml-auto hidden h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:border-pink-600 hover:bg-pink-600 hover:text-white lg:inline-flex xl:h-[38px] xl:w-[38px]"
        >
          <UserRound
            aria-hidden="true"
            className="h-[18px] w-[18px] xl:h-[17px] xl:w-[17px]"
            strokeWidth={1.8}
          />
        </Link>

        <Link
          href="/confier-mon-logement"
          className="hidden min-h-10 shrink-0 items-center rounded-full bg-slate-800 px-4 text-[12px] font-bold text-white transition-colors hover:bg-pink-600 lg:inline-flex xl:min-h-[38px] xl:px-[15px]"
        >
          Nous contacter
        </Link>

        <MarketingMobileMenu localNavigation={localNavigation} />
      </div>
    </header>
  )
}
