'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function SortControl({ currentSort }: { currentSort: 'distance' | 'rating' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setSort(sort: 'distance' | 'rating') {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === 'distance') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex gap-2 px-4 py-2" data-testid="sort-control">
      <button
        onClick={() => setSort('distance')}
        data-testid="sort-distance"
        className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
          currentSort === 'distance'
            ? 'bg-charcoal text-white'
            : 'bg-white text-charcoal/50 shadow-sm'
        }`}
      >
        Distance
      </button>
      <button
        onClick={() => setSort('rating')}
        data-testid="sort-rating"
        className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
          currentSort === 'rating'
            ? 'bg-charcoal text-white'
            : 'bg-white text-charcoal/50 shadow-sm'
        }`}
      >
        Note
      </button>
    </div>
  )
}
