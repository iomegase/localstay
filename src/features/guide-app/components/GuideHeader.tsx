'use client'

import { Menu } from 'lucide-react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'

export function GuideHeader({
  onOpenHome,
  onOpenMenu,
  menuEnabled = true,
}: {
  city?: string
  onOpenHome: () => void
  onOpenMenu?: () => void
  menuEnabled?: boolean
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/50 bg-white/85 px-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={onOpenHome}
        className="flex min-w-0 items-center gap-2 text-left"
        aria-label="Accueil du guide"
      >
        <MyStayLogo
          form="horizontal"
          className="h-9 w-auto object-contain"
          priority
          sizes="160px"
        />
      </button>

      {menuEnabled ? (
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          data-testid="guide-menu-icon"
          className="translate-x-1 translate-y-1.5 p-2 text-slate-800"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
      ) : null}
    </header>
  )
}
