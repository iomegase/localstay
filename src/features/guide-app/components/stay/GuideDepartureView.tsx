'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { departureTasks, translateFixedDeparture } from '@/features/guide-app/lib/fixed-lodging-content'
import type { GuideLodging } from '@/features/guide-app/types'
import { SignalError } from './GuideArrivalFlow'
import { GuideStayScreen } from './GuideStayScreen'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

/** Écran Départ : progression, checklist et « Je suis parti·e » (spec 054 AC-03-02, AC-04-02). */
export function GuideDepartureView({
  lodging,
  checked,
  onToggle,
  departed,
  onDeparted,
  onBack,
}: {
  lodging: GuideLodging
  checked: ReadonlySet<number>
  onToggle: (index: number) => void
  departed: boolean
  onDeparted: () => Promise<void>
  onBack: () => void
}) {
  const m = useGuideMessages()
  const tasks = departureTasks(lodging.departureInstructions)
  const done = tasks.filter((_, index) => checked.has(index)).length
  const remaining = tasks.length - done
  const complete = remaining === 0
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function signalDeparture() {
    setSending(true)
    setFailed(false)
    try {
      await onDeparted()
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <GuideStayScreen title={m.departure.title} onBack={onBack}>
      <div
        role="progressbar"
        aria-label={m.departure.progress}
        aria-valuemin={0}
        aria-valuemax={tasks.length}
        aria-valuenow={done}
        className="h-2 overflow-hidden rounded-full bg-[#EFEDE9]"
      >
        <div
          className="h-full rounded-full bg-[#DB2777] transition-[width] duration-300"
          style={{ width: `${tasks.length > 0 ? (done / tasks.length) * 100 : 0}%` }}
        />
      </div>
      <p className="mt-2 text-[13px] font-semibold text-[#BE185D]" aria-live="polite">
        {m.home.departureProgress(done, tasks.length)}
      </p>

      <ul className="mt-4 grid gap-2">
        {tasks.map((task, index) => {
          const isChecked = checked.has(index)
          return (
            <li key={`${task}-${index}`}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(17,17,17,0.06)]">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(index)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border ${
                    isChecked ? 'border-[#DB2777] bg-[#DB2777] text-white' : 'border-[rgba(17,17,17,0.15)] text-transparent'
                  }`}
                >
                  <Check className="h-4 w-4" />
                </span>
                <span className={`text-[14px] leading-snug ${isChecked ? 'text-[#697386] line-through' : 'text-[#111111]'}`}>
                  {translateFixedDeparture(task, m.fixed)}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        {departed ? (
          <div role="status" className="rounded-[22px] bg-[#111111] p-5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#DB2777]">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-[22px] font-semibold tracking-[-0.02em]">
              {m.departure.thanks(lodging.name)}
            </p>
            <p className="mt-1 text-[14px] text-[#FBCFE8]">{m.departure.conciergeNotified}</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={sending}
              onClick={signalDeparture}
              className={`flex h-14 w-full items-center justify-center rounded-2xl text-[16px] font-semibold text-white transition-colors disabled:opacity-60 ${
                complete ? 'bg-[#DB2777]' : 'bg-[#111111]'
              }`}
            >
              {m.departure.imLeaving}
            </button>
            <p className="mt-2 text-center text-[12px] text-[#697386]">
              {complete
                ? m.departure.willNotify
                : m.departure.remaining(remaining)}
            </p>
            {failed && <SignalError />}
          </>
        )}
      </div>
    </GuideStayScreen>
  )
}
