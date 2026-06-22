'use client'

import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { CategorySummary } from '@/features/city-guide/types'
import { CategoryBentoGrid } from '@/features/city-guide/components/CategoryBentoGrid'
import { t } from '@/shared/lib/i18n'

type City = { name: string; slug: string }
type Status = 'idle' | 'loading' | 'error'

export function CityCategoryExplorer({ cities }: { cities: City[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<City | null>(null)
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const searchParams = useSearchParams()
  const lodgingId = searchParams.get('lodging')
  const reduce = useReducedMotion()
  const abortRef = useRef<AbortController | null>(null)

  async function selectCity(city: City) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSelected(city)
    setOpen(false)
    setStatus('loading')
    try {
      const qs = lodgingId ? `?lodging=${encodeURIComponent(lodgingId)}` : ''
      const res = await fetch(`/api/cities/${city.slug}/categories${qs}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('request failed')
      const json = await res.json()
      setCategories(json.data ?? [])
      setStatus('idle')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setCategories([])
      setStatus('error')
    }
  }

  function cityHref(citySlug: string) {
    const base = `/guide/${citySlug}`
    return lodgingId ? `${base}?lodging=${encodeURIComponent(lodgingId)}` : base
  }

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between border-b border-charcoal/80 px-2 py-4 text-left"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal">
            {selected ? selected.name : t('home.select.placeholder')}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-charcoal transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="listbox"
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-black/5 bg-white py-2 shadow-xl"
            >
              {cities.map((city) => (
                <a
                  key={city.slug}
                  role="option"
                  aria-selected={selected?.slug === city.slug}
                  href={cityHref(city.slug)}
                  onClick={(e) => {
                    e.preventDefault()
                    selectCity(city)
                  }}
                  className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm text-charcoal hover:bg-gray-50"
                >
                  {city.name}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenu par défaut référençable (SSR) : accroche + liens villes crawlables.
          Disparaît dès qu'une ville est choisie (le bento de catégories prend le relais). */}
      {status === 'idle' && !selected && (
        <div className="mt-8 space-y-5">
          <p className="text-sm leading-relaxed text-[#6E6E73]">{t('home.explore.lead')}</p>
          <nav aria-label={t('home.explore.heading')}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/50">
              {t('home.explore.heading')}
            </p>
            <ul className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={cityHref(city.slug)}
                    onClick={(e) => {
                      e.preventDefault()
                      selectCity(city)
                    }}
                    className="inline-flex rounded-full border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal transition-colors hover:border-charcoal/40"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {status === 'loading' && (
        <div className="mt-6 grid grid-cols-2 gap-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      )}

      {status === 'error' && <p className="mt-6 text-sm text-gray-500">{t('home.error')}</p>}

      {status === 'idle' && selected && categories.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">{t('home.empty')}</p>
      )}

      {status === 'idle' && selected && categories.length > 0 && (
        <CategoryBentoGrid categories={categories} citySlug={selected.slug} lodgingId={lodgingId} />
      )}
    </div>
  )
}
