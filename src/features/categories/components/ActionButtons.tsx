'use client'
import { Phone, Navigation, Globe, Share2, CalendarPlus } from 'lucide-react'

interface Props {
  phone: string | null
  website: string | null
  latitude: number
  longitude: number
  poiName: string
  poiUrl: string
}

export function ActionButtons({ phone, website, latitude, longitude, poiName, poiUrl }: Props) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
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
