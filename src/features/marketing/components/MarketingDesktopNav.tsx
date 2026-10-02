'use client'

import type { LocalMarketingNavigation } from './marketing-navigation'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { marketingNavigationFor } from './marketing-navigation'

export function MarketingDesktopNav({ localNavigation }: { localNavigation?: LocalMarketingNavigation } = {}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation principale"
      className="ml-auto hidden shrink-0 items-center gap-1 text-[12px] font-semibold lg:flex xl:gap-1.5"
    >
      {marketingNavigationFor(pathname, localNavigation).map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="whitespace-nowrap rounded-full px-3 py-2.5 transition-colors hover:bg-pink-50 hover:text-pink-600 xl:px-[9px] xl:py-2"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
