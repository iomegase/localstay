'use client'
import { Phone, Navigation, Globe, Share2, CalendarPlus } from 'lucide-react'
import { FavoriteToggleButton } from '@/features/public-menu/components/FavoriteToggleButton'

interface Props {
  phone: string | null
  website: string | null
  latitude: number
  longitude: number
  address: string
  poiName: string
  poiUrl: string
  favorite?: {
    poi_id: string
    city_slug: string
    category_slug: string
    poi_slug: string
    photo: string | null
  }
}

export function ActionButtons({ phone, website, latitude, longitude, address, poiName, poiUrl, favorite }: Props) {
  const destination = address.trim() || `${latitude},${longitude}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeMapsDestination(destination)}`
  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null

  async function handleShare() {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: poiName, url: poiUrl })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {telHref && (
        <a
          href={telHref}
          data-testid="btn-call"
          className="flex-1 py-3 rounded-2xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
        >
          <Phone className="w-4 h-4" />
      
        </a>
      )}

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="btn-directions"
        className="flex-1 py-3 rounded-2xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
      >
        <Navigation className="w-4 h-4" />
        Itinéraire
      </a>

      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="btn-site"
          className="flex-1 py-3 rounded-2xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
        >
          <Globe className="w-4 h-4" />
          Site
        </a>
      )}

      <button
        onClick={handleShare}
        data-testid="btn-share"
        className="flex-1 py-3 rounded-2xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
      >
        <Share2 className="w-4 h-4" />

      </button>

      {favorite && (
        <FavoriteToggleButton
          poi={{
            poi_id: favorite.poi_id,
            name: poiName,
            city_slug: favorite.city_slug,
            category_slug: favorite.category_slug,
            poi_slug: favorite.poi_slug,
            photo: favorite.photo,
            added_at: '',
          }}
        />
      )}

      <button
        disabled
        data-testid="btn-reserve"
        className="flex-1 py-3 rounded-2xl border border-orange-400/50 text-orange-400/60 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
      >
        <CalendarPlus className="w-4 h-4" />
        Réserver
      </button>
    </div>
  )
}

function encodeMapsDestination(value: string): string {
  return encodeURIComponent(value).replace(/'/g, '%27')
}
