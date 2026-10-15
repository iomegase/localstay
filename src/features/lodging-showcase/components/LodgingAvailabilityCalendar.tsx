'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, AVAILABILITY_HORIZON_MONTHS, isBusyNight, monthGrid, type BusyRange } from '../lib/availability'
import { LodgingSectionEyebrow } from './LodgingSectionEyebrow'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function Month({ firstOfMonth, today, busy }: { firstOfMonth: string; today: string; busy: BusyRange[] }) {
  return (
    <div data-testid="availability-month" className="min-w-0">
      <h3 className="mb-4 text-center text-[15px] font-semibold capitalize text-slate-800">
        {monthLabel.format(new Date(`${firstOfMonth}T00:00:00Z`))}
      </h3>
      <table className="w-full table-fixed border-collapse text-center text-[13px]">
        <thead>
          <tr>
            {WEEKDAYS.map((day, index) => (
              <th key={index} scope="col" className="pb-2 text-[11px] font-semibold text-slate-400">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(firstOfMonth).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((cell, dayIndex) => {
                if (!cell) return <td key={dayIndex} />
                const past = cell.date < today
                const busyNight = !past && isBusyNight(cell.date, busy)
                const state = past ? 'past' : busyNight ? 'busy' : 'available'
                return (
                  <td key={dayIndex} className="p-0.5">
                    <span
                      data-date={cell.date}
                      data-state={state}
                      aria-label={`${cell.day} ${state === 'available' ? 'disponible' : 'indisponible'}`}
                      className={`mx-auto flex aspect-square max-w-[42px] items-center justify-center rounded-full ${
                        state === 'available'
                          ? 'font-semibold text-slate-800'
                          : state === 'busy'
                            ? 'text-slate-300 line-through'
                            : 'text-slate-300'
                      } ${cell.date === today ? 'ring-1 ring-pink-600' : ''}`}
                    >
                      {cell.day}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Spec 089 AC-02 : 12 mois à partir du mois courant, un mois à la fois (AC-02-04, à côté de la carte). */
export function LodgingAvailabilityCalendar({ today, busy }: { today: string; busy: BusyRange[] }) {
  const [offset, setOffset] = useState(0)
  const last = AVAILABILITY_HORIZON_MONTHS - 1
  const month = addMonths(today, offset)

  return (
    <section data-testid="lodging-availability" className="flex flex-col">
      <LodgingSectionEyebrow>Disponibilités</LodgingSectionEyebrow>
      <div className="relative flex-1 rounded-[24px] bg-white p-5 shadow-md sm:p-7">
        {/* AC-02-15 : navigation dans la carte, de part et d’autre du mois. */}
        <button
          type="button"
          aria-label="Mois précédent"
          disabled={offset === 0}
          onClick={() => setOffset(value => Math.max(0, value - 1))}
          className="absolute top-3 left-3 sm:top-5 sm:left-5 flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition disabled:opacity-30 disabled:shadow-none"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Mois suivant"
          disabled={offset >= last}
          onClick={() => setOffset(value => Math.min(last, value + 1))}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition disabled:opacity-30 disabled:shadow-none"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
        <Month firstOfMonth={month} today={today} busy={busy} />
        {/* <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-5 text-[12px] text-slate-500">
          <span className="flex items-center gap-2"><span className="font-semibold text-slate-800">12</span> Disponible</span>
          <span className="flex items-center gap-2"><span className="text-slate-300 line-through">12</span> Indisponible</span>
          <span className="sm:ml-auto">Réservation sur la plateforme</span>
        </div> */}
      </div>
    </section>
  )
}
