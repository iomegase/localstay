import type { PoiHours } from '../types'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** Spec 061 : libellés traduits fournis par le guide privé ; français par défaut. */
export type HoursBlockLabels = {
  days: readonly string[]
  open: string
  closesAt: string
  closed: string
  hourSuffix: string
}

const FRENCH_LABELS: HoursBlockLabels = { days: DAY_LABELS, open: 'Ouvert', closesAt: 'ferme à', closed: 'Fermé', hourSuffix: ' H' }

interface Props {
  is_open_now: boolean | null
  hours: PoiHours | null
  today?: number  // 0-6, defaults to new Date().getDay()
  showOpenBadge?: boolean
  labels?: HoursBlockLabels
}

export function HoursBlock({ is_open_now, hours, today = new Date().getDay(), showOpenBadge = true, labels = FRENCH_LABELS }: Props) {
  if (!hours) return null

  const todayHours = hours[today.toString() as keyof PoiHours] ?? null
  const closingTime = todayHours?.close ?? null

  const days = [0, 1, 2, 3, 4, 5, 6] as const

  return (
    <div className="space-y-6 text-[10px]">
      {is_open_now === true && (
        <div className="flex items-center gap-2">
          {showOpenBadge && (
            <span
              data-testid="badge-open"
              className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"
            >
              {labels.open}
            </span>
          )}
          {closingTime && (
            <span className="text-[10px] uppercase tracking-widest text-red-500">
              {showOpenBadge ? '· ' : ''}{labels.closesAt}{' '}
              <span data-testid="closing-time" className="font-semibold text-red-500">
                {closingTime}{labels.hourSuffix}
              </span>
            </span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {days.map(day => {
          const dayHours = hours[day.toString() as keyof PoiHours] ?? null
          const isToday = day === today
          return (
            <div
              key={day}
              data-testid={`hours-row-${day}`}
              className={`flex justify-between text-[11px] ${isToday ? 'font-bold text-charcoal' : 'text-charcoal/60'}`}
            >
              <span>{labels.days[day]}</span>
              <span>{dayHours ? `${dayHours.open} – ${dayHours.close}` : labels.closed}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
