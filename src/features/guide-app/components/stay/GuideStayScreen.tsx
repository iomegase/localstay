'use client'

import { ArrowLeft } from 'lucide-react'

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
  return (
    <div className="min-h-full animate-guide-slide-in bg-[#F6F6F4] px-5 pb-10 pt-[calc(16px+env(safe-area-inset-top))] motion-reduce:animate-none">
      <button
        type="button"
        onClick={onBack}
        aria-label="Revenir au séjour"
        className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.15)]"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
      </button>
      <h1 className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#111111]">{title}</h1>
      {subtitle ? <p className="mt-1 text-[14px] text-[#697386]">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  )
}
