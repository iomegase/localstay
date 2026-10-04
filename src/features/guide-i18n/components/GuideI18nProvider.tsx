'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { INTL_LOCALE, type GuideLocale } from '../lib/locale'
import { guideMessages } from '../messages'
import { GuideI18nContext, type GuideI18n } from './GuideI18nContext'

/** Spec 061 : langue du guide privé, rendue côté serveur puis modifiable sans rechargement. */
export function GuideI18nProvider({ initialLocale, children }: { initialLocale: GuideLocale; children: ReactNode }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<GuideLocale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: GuideLocale) => {
    setLocaleState(next)
    void fetch('/api/guide/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    })
      .then(response => { if (response.ok) router.refresh() })
      .catch(() => undefined)
  }, [router])

  const value = useMemo<GuideI18n>(
    () => ({ locale, intlLocale: INTL_LOCALE[locale], messages: guideMessages(locale), setLocale }),
    [locale, setLocale],
  )

  return (
    <GuideI18nContext.Provider value={value}>
      <div lang={locale} className="contents">{children}</div>
    </GuideI18nContext.Provider>
  )
}
