import { Flag, MapPin } from 'lucide-react'
import { getLineEndpoints, isValidTrailGeometry } from '../lib/geo'

interface Props {
  name: string
  geometry: unknown | null
  startLatitude: number | null
  startLongitude: number | null
}

export function TrailPreviewMap({ name, geometry, startLatitude, startLongitude }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
  const hasStart = startLatitude !== null && startLongitude !== null
  const src = hasStart
    ? `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-s+455E4C(${startLongitude},${startLatitude})/${startLongitude},${startLatitude},13/720x520?access_token=${token}`
    : null
  const endpoints = isValidTrailGeometry(geometry) ? getLineEndpoints(geometry) : null

  return (
    <section className="relative overflow-hidden bg-[#E8E6DF] shadow-sm" data-testid="trail-preview-map">
      <div className="relative h-[340px]">
        {src ? (
          <img src={src} alt={`Carte randonnée — ${name}`} className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#dfe8d7] to-[#b5c7aa]" />
        )}

        {endpoints && (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 340" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 70 282 C 116 230 104 188 166 162 C 222 138 194 86 252 62 C 286 48 314 36 338 22"
              fill="none"
              stroke="white"
              strokeLinecap="round"
              strokeWidth="13"
              className="opacity-90"
            />
            <path
              d="M 70 282 C 116 230 104 188 166 162 C 222 138 194 86 252 62 C 286 48 314 36 338 22"
              fill="none"
              stroke="#455E4C"
              strokeLinecap="round"
              strokeWidth="6"
            />
          </svg>
        )}

        {hasStart && (
          <div className="absolute bottom-[13%] left-[18%] flex flex-col items-center">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-4 border-[#455E4C] bg-white shadow-md" />
            <span className="mt-2 rounded-lg bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm">Départ</span>
          </div>
        )}

        {endpoints && (
          <div className="absolute right-[6%] top-[6%] flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#455E4C] text-white shadow-xl ring-4 ring-white/50">
              <Flag className="h-4 w-4" />
            </span>
            <span className="mt-2 rounded-lg bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm">
              Arrivée
            </span>
          </div>
        )}

        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-xl bg-white/85 px-3 py-2 text-[10px] font-bold text-[#121212] shadow-sm">
          <MapPin className="h-3 w-3" />
          Mapbox outdoors
        </div>
      </div>
    </section>
  )
}
