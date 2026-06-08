'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { t } from '@/shared/lib/i18n'
import type { CitySearchResult } from '../types'

export function CitySearchInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [noResults, setNoResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 3) {
      setResults([])
      setNoResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/cities/search?q=${encodeURIComponent(query)}`
        )
        const json = await res.json()
        const data: CitySearchResult[] = json.data ?? []
        setResults(data)
        setNoResults(data.length === 0)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleSelect(city: CitySearchResult) {
    router.push(`/guide/${city.slug}`)
  }

  return (
    <div className="relative w-full max-w-[382px] mx-auto">
      {/* Search input */}
      <div className="flex items-center gap-4 border-b-black border-b-[1px] px-6 py-4 shadow-sm">
        <Search className="w-4 h-4 text-gray-300 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('home.search.placeholder')}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-300 text-charcoal"
          aria-label={t('home.search.placeholder')}
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="absolute mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-lg px-4 py-3 text-sm text-gray-400">
          Recherche…
        </div>
      )}

      {/* No results */}
      {!isLoading && noResults && (
        <div className="absolute mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-lg px-4 py-3 text-sm text-gray-500">
          {t('home.search.no_results', { q: query })}
        </div>
      )}

      {/* Results list */}
      {!isLoading && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden z-10"
        >
          {results.map((city) => (
            <li
              key={city.id}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(city)}
              className="px-6 py-3 hover:bg-ivory cursor-pointer flex justify-between items-center"
            >
              <span className="text-sm font-medium text-charcoal">{city.name}</span>
              <span className="text-xs text-gray-400">{city.postal_code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
