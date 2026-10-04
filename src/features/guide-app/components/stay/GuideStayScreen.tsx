'use client'

import { ChevronLeft } from 'lucide-react'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

/** Écran secondaire plein écran (spec 054) : entrée slideIn 280 ms, retour rond 44 px. */
export function GuideStayScreen({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  onBack: () => void
  children: React.ReactNode
}) {
  const m = useGuideMessages()
  return (
    <div className="min-h-full animate-guide-slide-in bg-white px-5 pb-10 pt-[calc(16px+env(safe-area-inset-top))] motion-reduce:animate-none">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={m.stayScreen.back}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.15)]"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#111111]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[14px] text-[#697386]">{subtitle}</p> : null}
        </div>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  )
}
