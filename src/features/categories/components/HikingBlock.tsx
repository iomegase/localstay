import { TrendingUp, Timer, Route, MapPin, ParkingCircle, Dog } from 'lucide-react'
import type { HikingDetailData } from '../types'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Facile',
  moderate: 'Modéré',
  hard: 'Difficile',
  expert: 'Expert',
}

const SEASON_LABEL: Record<string, string> = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '–'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m}`
}

interface Props {
  hiking: HikingDetailData
}

export function HikingBlock({ hiking }: Props) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-serif italic text-charcoal">Informations randonnée</h2>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center shadow-sm">
          <TrendingUp className="w-5 h-5 text-charcoal/40 mb-2" />
          <span className="text-sm font-semibold" data-testid="hiking-elevation">
            {hiking.elevation_gain_m !== null ? `${hiking.elevation_gain_m} m` : '–'}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-charcoal/40 mt-0.5">Dénivelé</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center shadow-sm">
          <Timer className="w-5 h-5 text-charcoal/40 mb-2" />
          <span className="text-sm font-semibold" data-testid="hiking-duration">
            {formatDuration(hiking.duration_minutes)}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-charcoal/40 mt-0.5">Durée</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center shadow-sm">
          <Route className="w-5 h-5 text-charcoal/40 mb-2" />
          <span className="text-sm font-semibold" data-testid="hiking-distance">
            {hiking.distance_km !== null ? `${hiking.distance_km.toFixed(1)} km` : '–'}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-charcoal/40 mt-0.5">Distance</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          data-testid="hiking-difficulty"
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-charcoal text-white"
        >
          {DIFFICULTY_LABEL[hiking.difficulty] ?? hiking.difficulty}
        </span>
      </div>

      {hiking.starting_point && (
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-charcoal/40 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-charcoal/50 mb-0.5">Point de départ</p>
            <p className="text-sm text-charcoal" data-testid="hiking-starting-point">{hiking.starting_point}</p>
          </div>
        </div>
      )}

      {hiking.parking_info && (
        <div className="flex items-start gap-3">
          <ParkingCircle className="w-4 h-4 text-charcoal/40 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-charcoal/50 mb-0.5">Parking</p>
            <p className="text-sm text-charcoal" data-testid="hiking-parking">{hiking.parking_info}</p>
          </div>
        </div>
      )}

      {hiking.pets_friendly && (
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-charcoal/70" data-testid="hiking-pets">
            <Dog className="w-4 h-4" /> Animaux acceptés
          </span>
        </div>
      )}

      {hiking.best_season.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-charcoal/50 mb-2">Saison recommandée</p>
          <div className="flex flex-wrap gap-2" data-testid="hiking-season">
            {hiking.best_season.map(s => (
              <span key={s} className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 text-charcoal/70">
                {SEASON_LABEL[s] ?? s}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
