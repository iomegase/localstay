'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { categoryResultHref, poiResultHref } from '../lib/guide-search-links'
import type { GuideSearchResults } from '../queries/cities'

const EMPTY: GuideSearchResults = { pois: [], categories: [] }

export function GuideSearchInput({
  citySlug,
  lodgingId,
}: {
  citySlug: string
  lodgingId?: string | null
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GuideSearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults(EMPTY)
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setOpen(true)
      try {
        const res = await fetch(`/api/cities/${citySlug}/search?q=${encodeURIComponent(query.trim())}`)
        const json = (await res.json().catch(() => null)) as { data?: GuideSearchResults } | null
        setResults(json?.data ?? EMPTY)
      } catch {
        setResults(EMPTY)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, citySlug])

  function go(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const hasResults = results.pois.length > 0 || results.categories.length > 0

  return (
    <div className="relative">
      <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-full px-6 py-4 shadow-sm">
        <Search className="w-4 h-4 text-gray-300 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Une envie particulière ?"
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-300 text-charcoal"
          aria-label="Rechercher une envie"
          aria-autocomplete="list"
          aria-expanded={open && hasResults}
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          {loading && <p className="px-5 py-3 text-sm text-gray-400">Recherche…</p>}

          {!loading && !hasResults && (
            <p className="px-5 py-3 text-sm text-gray-500">Aucun résultat pour «&nbsp;{query.trim()}&nbsp;».</p>
          )}

          {!loading && results.categories.length > 0 && (
            <ul role="listbox" className="border-b border-gray-50">
              {results.categories.map(category => (
                <li
                  key={`cat-${category.slug}`}
                  role="option"
                  aria-selected={false}
                  onClick={() => go(categoryResultHref(citySlug, category.slug, lodgingId))}
                  className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-ivory"
                >
                  <span className="text-sm font-medium text-charcoal">{category.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">Catégorie</span>
                </li>
              ))}
            </ul>
          )}

          {!loading && results.pois.length > 0 && (
            <ul role="listbox">
              {results.pois.map(poi => (
                <li
                  key={`poi-${poi.id}`}
                  role="option"
                  aria-selected={false}
                  onClick={() => go(poiResultHref(citySlug, poi.category_slug, poi.slug, lodgingId))}
                  className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-ivory"
                >
                  {poi.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poi.photo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="h-9 w-9 shrink-0 rounded-lg bg-gray-100" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-charcoal">{poi.name}</span>
                    {poi.subcategory_name && (
                      <span className="block truncate text-[11px] text-gray-400">{poi.subcategory_name}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
