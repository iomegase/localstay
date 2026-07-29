import Link from 'next/link'
import { Menu, UserRound } from 'lucide-react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'
import { marketingContainerClass } from './marketing-styles'

const navigation = [
  { href: '/#services', label: 'Nos services' },
  { href: '/logements', label: 'Nos logements' },
  { href: '/seminaires', label: 'Séminaires' },
  { href: '/concept', label: 'Notre approche' },
  { href: '/blog', label: 'Blog' },
] as const

export function MarketingBrand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="MyStay — Accueil" className="inline-flex shrink-0 items-center">
      <MyStayLogo
        tone={light ? 'reversed' : 'standard'}
        alt="MyStay"
        className="h-auto w-[116px] object-contain sm:w-[132px] xl:w-[118px]"
        priority={!light}
        sizes="(min-width: 1280px) 118px, (min-width: 640px) 132px, 116px"
      />
    </Link>
  )
}

export function MarketingHeader() {
  return (
    <header className="relative z-[80] mb-2.5 bg-white py-1 md:mb-[clamp(14px,1.6vw,24px)] md:py-[clamp(6px,0.7vw,10px)]">
      <div
        className={`${marketingContainerClass} flex h-[72px] items-center gap-4 md:h-[76px] xl:h-[62px] xl:gap-[14px]`}
      >
        <MarketingBrand />

        <nav
          aria-label="Navigation principale"
          className="ml-auto hidden items-center gap-1 text-[12px] font-semibold lg:flex xl:gap-1.5"
        >
          {navigation.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2.5 transition-colors hover:bg-pink-50 hover:text-pink-600 xl:px-[9px] xl:py-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/auth/login"
          aria-label="Se connecter à l’espace propriétaire"
          title="Se connecter"
          className="ml-auto hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-pink-600 hover:bg-pink-600 hover:text-white lg:inline-flex xl:h-[38px] xl:w-[38px]"
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
          Confier mon logement
        </Link>

        <details className="group relative ml-auto lg:hidden">
          <summary
            aria-label="Ouvrir le menu"
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white [&::-webkit-details-marker]:hidden"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </summary>
          <nav
            aria-label="Navigation mobile"
            className="absolute right-0 top-12 grid min-w-[235px] gap-1 rounded-2xl border border-slate-100 bg-white p-3 text-sm font-semibold shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
          >
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2.5 hover:bg-pink-50 hover:text-pink-600"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-pink-50 hover:text-pink-600"
            >
              <UserRound aria-hidden="true" className="h-4 w-4" />
              Se connecter
            </Link>
            <Link
              href="/confier-mon-logement"
              className="mt-1 rounded-xl bg-slate-800 px-3 py-3 text-center text-white"
            >
              Confier mon logement
            </Link>
          </nav>
        </details>
      </div>
    </header>
  )
}
