'use client'

import { Menu } from 'lucide-react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'

export function GuideHeader({
  city,
  onOpenHome,
}: {
  city: string
  onOpenHome: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/50 bg-white/85 px-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={onOpenHome}
        className="flex min-w-0 items-center gap-2 text-left"
        aria-label="Accueil du guide"
      >
        <span className="min-w-0">
          <MyStayLogo
            form="mark"
            className="h-auto w-[50px] object-contain"
            priority
            sizes="50px"
          />
          <span className="block truncate text-[9px] text-slate-500">{city}</span>
        </span>
      </button>

      <span
        aria-hidden="true"
        data-testid="guide-menu-icon"
        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-700"
      >
        <Menu className="h-4 w-4" />
      </span>
    </header>
  )
}
