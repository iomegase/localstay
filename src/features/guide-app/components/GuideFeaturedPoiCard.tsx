import Image from 'next/image'
import { MapPinned } from 'lucide-react'
import type { GuidePoi } from '@/features/guide-app/types'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'

export function GuideFeaturedPoiCard({
  poi,
  onSelect,
}: {
  poi: GuidePoi
  onSelect: (poi: GuidePoi) => void
}) {
  const heroImage = getGuidePoiHeroImage({
    categorySlug: poi.category.slug,
    photos: poi.photos,
  })

  return (
    <button
      type="button"
      data-testid="guide-featured-card"
      aria-label={`Ouvrir ${poi.name}`}
      onClick={() => onSelect(poi)}
      className="group relative aspect-square h-[156px] w-[156px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-slate-900 text-left text-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
    >
      <Image
        src={heroImage}
        alt={poi.name}
        fill
        unoptimized={heroImage.startsWith('https://')}
        sizes="156px"
        className="object-cover transition duration-500 group-hover:brightness-95"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4">
        <strong className="line-clamp-2 block text-sm leading-[1.1]">
          {poi.name}
        </strong>
        {poi.distanceLabel && (
          <span className="mt-2 flex items-center gap-1 text-[9px] text-white/75">
            <MapPinned className="h-3 w-3" />
            {poi.distanceLabel}
          </span>
        )}
      </span>
    </button>
  )
}
