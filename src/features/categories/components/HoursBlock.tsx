'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PoiHours } from '../types'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface Props {
  is_open_now: boolean | null
  hours: PoiHours | null
  today?: number  // 0-6, defaults to new Date().getDay()
}

export function HoursBlock({ is_open_now, hours, today = new Date().getDay() }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!hours) return null

  const todayHours = hours[today.toString() as keyof PoiHours] ?? null
  const closingTime = todayHours?.close ?? null

  const days = [0, 1, 2, 3, 4, 5, 6] as const

  return (
    <div className="space-y-3">
      {is_open_now === true && (
        <div className="flex items-center gap-2">
          <span
            data-testid="badge-open"
            className="text-xs font-bold uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"
          >
            Ouvert
          </span>
          {closingTime && (
            <span className="text-xs text-charcoal/60">
              · ferme à{' '}
              <span data-testid="closing-time" className="font-semibold">
                {closingTime}
              </span>
            </span>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-charcoal/50"
      >
        {expanded ? 'Masquer les horaires' : 'Tous les horaires'}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
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
                <span>{DAY_LABELS[day]}</span>
                <span>{dayHours ? `${dayHours.open} – ${dayHours.close}` : 'Fermé'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
