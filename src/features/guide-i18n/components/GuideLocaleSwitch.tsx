'use client'

import type { KeyboardEvent, TouchEvent } from 'react'
import { useRef } from 'react'
import { GUIDE_LOCALES, type GuideLocale } from '../lib/locale'
import { useGuideI18n } from './GuideI18nContext'

const LABELS: Record<GuideLocale, { short: string; name: string }> = {
  fr: { short: 'FR', name: 'Français' },
  en: { short: 'GB', name: 'English' },
}

/** Spec 061 AC-01-01 / AC-01-06 : capsule « FR | GB » à pastille glissante. */
export function GuideLocaleSwitch() {
  const { locale, setLocale, messages } = useGuideI18n()
  const touchStartX = useRef<number | null>(null)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      setLocale(locale === 'fr' ? 'en' : 'fr')
    }
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current
    const end = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (start === null || end === undefined || Math.abs(end - start) < 16) return
    setLocale(end > start ? 'en' : 'fr')
  }

  return (
    <div
      role="radiogroup"
      aria-label={messages.header.language}
      onKeyDown={onKeyDown}
      onTouchStart={event => { touchStartX.current = event.touches[0]?.clientX ?? null }}
      onTouchEnd={onTouchEnd}
      className="relative grid h-8 w-[72px] shrink-0 grid-cols-2 rounded-full border border-slate-200 bg-slate-100 p-0.5"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-sm motion-safe:transition-transform motion-safe:duration-200 ${locale === 'en' ? 'translate-x-full' : 'translate-x-0'}`}
      />
      {GUIDE_LOCALES.map(option => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={locale === option}
          aria-label={LABELS[option].name}
          tabIndex={locale === option ? 0 : -1}
          onClick={() => { if (option !== locale) setLocale(option) }}
          className={`relative z-10 min-h-11 -my-1.5 text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 ${locale === option ? 'text-slate-900' : 'text-slate-500'}`}
        >
          {LABELS[option].short}
        </button>
      ))}
    </div>
  )
}
