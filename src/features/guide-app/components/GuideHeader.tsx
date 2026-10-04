'use client'

import { Menu } from 'lucide-react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'
import { GuideLocaleSwitch } from '@/features/guide-i18n/components/GuideLocaleSwitch'

export function GuideHeader({
  onOpenHome,
  onOpenMenu,
  menuEnabled = true,
  localeSwitch = false,
}: {
  city?: string
  onOpenHome: () => void
  onOpenMenu?: () => void
  menuEnabled?: boolean
  /** Spec 061 : sélecteur FR | GB, guide privé uniquement. */
  localeSwitch?: boolean
}) {
  const m = useGuideMessages()
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/50 bg-white/85 px-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={onOpenHome}
        className="flex min-w-0 items-center gap-2 text-left"
        aria-label={m.header.home}
      >
        <MyStayLogo
          form="horizontal"
          className="h-9 w-auto object-contain"
          priority
          sizes="160px"
        />
      </button>

      <div className="flex items-center gap-2">
      {localeSwitch ? <GuideLocaleSwitch /> : null}
      {menuEnabled ? (
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={m.header.openMenu}
          data-testid="guide-menu-icon"
          className="translate-x-1 translate-y-1.5 p-2 text-slate-800"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
      ) : null}
      </div>
    </header>
  )
}
