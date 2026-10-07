'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, AVAILABILITY_HORIZON_MONTHS, isBusyNight, monthGrid, type BusyRange } from '../lib/availability'

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

/** Spec 089 AC-02 : 12 mois à partir du mois courant, 1 mois sur mobile, 2 dès md. */
export function LodgingAvailabilityCalendar({ today, busy }: { today: string; busy: BusyRange[] }) {
  const [offset, setOffset] = useState(0)
  const last = AVAILABILITY_HORIZON_MONTHS - 1
  const first = addMonths(today, offset)
  const second = offset < last ? addMonths(today, offset + 1) : null

  return (
    <section data-testid="lodging-availability">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">Bon à savoir</span>
      <div className="mb-7 mt-2 flex items-end justify-between gap-4">
        <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 md:text-[36px]">
          Disponibilités.
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Mois précédent"
            disabled={offset === 0}
            onClick={() => setOffset(value => Math.max(0, value - 1))}
            className="flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            disabled={offset >= last}
            onClick={() => setOffset(value => Math.min(last, value + 1))}
            className="flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="rounded-[24px] bg-white p-5 shadow-md sm:p-7">
        <div className="grid gap-10 md:grid-cols-2">
          <Month firstOfMonth={first} today={today} busy={busy} />
          {second && (
            <div className="hidden md:block">
              <Month firstOfMonth={second} today={today} busy={busy} />
            </div>
          )}
        </div>
        {/* <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-5 text-[12px] text-slate-500">
          <span className="flex items-center gap-2"><span className="font-semibold text-slate-800">12</span> Disponible</span>
          <span className="flex items-center gap-2"><span className="text-slate-300 line-through">12</span> Indisponible</span>
          <span className="sm:ml-auto">Réservation sur la plateforme</span>
        </div> */}
      </div>
    </section>
  )
}
