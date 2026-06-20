'use client'

import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { CategorySummary } from '@/features/city-guide/types'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import {
  getCategoryImage,
  getFallbackGradient,
} from '@/features/city-guide/lib/category-images'
import { t } from '@/shared/lib/i18n'

type City = { name: string; slug: string }
type Status = 'idle' | 'loading' | 'error'

const spring = { type: 'spring' as const, stiffness: 260, damping: 13 }

// Cadrage de l'image par slug (object-position). Défaut : object-center.
const CARD_IMAGE_POSITION: Record<string, string> = {
  culture: 'object-cover',
}

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

  function categoryHref(catSlug: string) {
    const base = `/guide/${selected?.slug}/${catSlug}`
    return lodgingId ? `${base}?lodging=${encodeURIComponent(lodgingId)}` : base
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

      {status === 'idle' && categories.length > 0 && (
        <motion.div
          key={selected?.slug}
          className="mt-6 grid grid-cols-2 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
        >
          {categories.flatMap((cat, index) => {
            const card = (
              <CategoryBentoCard
                key={cat.id}
                category={cat}
                href={categoryHref(cat.slug)}
                wide={index % 4 === 0}
                reduce={!!reduce}
              />
            )
            // Carte « Nos favoris » insérée à droite de Rando (logique à venir).
            if (cat.slug === 'rando') {
              return [card, <FavoritesCard key="nos-favoris" reduce={!!reduce} />]
            }
            return [card]
          })}
        </motion.div>
      )}
    </div>
  )
}

function CategoryBentoCard({
  category,
  href,
  wide,
  reduce,
}: {
  category: CategorySummary
  href: string
  wide: boolean
  reduce: boolean
}) {
  const image = getCategoryImage(category.slug)
  const objectPosition = CARD_IMAGE_POSITION[category.slug] ?? 'object-center'

  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 },
        show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={wide ? 'col-span-2' : 'col-span-1'}
    >
      <Link
        href={href}
        className={`relative flex w-full items-end overflow-hidden rounded-3xl shadow-md ${
          wide ? 'aspect-[382/185]' : 'aspect-square'
        }`}
      >
        {image ? (
          <>
            <Image
              src={image}
              alt={category.name}
              fill
              unoptimized
              sizes="(max-width: 430px) 50vw, 215px"
              className={`object-cover ${objectPosition}`}
            />
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /> */}
            <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
              {category.name}
            </span>
          </>
        ) : (
          <div
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${getFallbackGradient(category.slug)} p-3 text-white`}
          >
            <CategoryIcon iconSlug={category.icon} className="h-7 w-7" />
            <span className="text-xs font-bold uppercase tracking-wide">{category.name}</span>
          </div>
        )}
      </Link>
    </motion.div>
  )
}

function FavoritesCard({ reduce }: { reduce: boolean }) {
  // TODO(favoris): brancher la logique de récupération des favoris admin.
  // Pour l'instant la carte n'est pas navigante (pas de lien).
  function handleClick() {
    // À implémenter : ouvrir / charger les favoris.
  }

  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 },
        show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className="col-span-1"
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative flex aspect-square w-full items-end overflow-hidden rounded-3xl shadow-md"
      >
        <Image
          src="/home/nos-favoris.png"
          alt="Nos favoris"
          fill
          unoptimized
          sizes="(max-width: 430px) 50vw, 215px"
          className="object-cover"
        />
        <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
          Nos favoris
        </span>
      </button>
    </motion.div>
  )
}
