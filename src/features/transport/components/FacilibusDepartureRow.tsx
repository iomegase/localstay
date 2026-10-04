import { formatParisTime } from '../lib/time'
import { RoutePill } from './RoutePill'
import type { PublicDeparture } from '../types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

function formatDelay(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes === 0) return "À l'heure"
  return minutes > 0 ? `+${minutes} min` : `−${Math.abs(minutes)} min`
}

const STATUS_KEYS: Partial<Record<PublicDeparture['status'], 'approaching' | 'atStop'>> = {
  approaching: 'approaching',
  at_stop: 'atStop',
}

/** Un passage : ligne, direction, horaire exploitable, écart et fraîcheur (spec 055 AC-02-04/05). */
export function FacilibusDepartureRow({ departure }: { departure: PublicDeparture }) {
  const m = useGuideMessages()
  const statusKey = STATUS_KEYS[departure.status]
  const statusLabel = statusKey ? m.transport[statusKey] : null
  const showDelay = departure.realtime && departure.delaySeconds !== null

  return (
    <li className="flex items-center gap-3 py-3">
      <RoutePill route={departure.route} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-[#111111]">{departure.headsign}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#697386]">
          {statusLabel ? <span className="font-semibold text-[#BE185D]">{statusLabel}</span> : null}
          {departure.vehicleLocated ? <span>{m.transport.vehicleRunning}</span> : null}
          {departure.realtime ? (
            <span className="rounded-full bg-[#FCE7F3] px-2 py-0.5 font-semibold text-[#BE185D]">{m.transport.realtime}</span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <time dateTime={departure.referenceAt} className="block text-[14px] font-semibold tabular-nums text-[#111111]">
          {formatParisTime(departure.referenceAt)}
        </time>
        {showDelay ? (
          <span className="block text-[12px] tabular-nums text-[#697386]">
            {departure.delaySeconds !== 0 ? (
              <>
                <s aria-label={m.transport.scheduled(formatParisTime(departure.scheduledAt))}>{formatParisTime(departure.scheduledAt)}</s>{' '}
              </>
            ) : null}
            <span className={departure.delaySeconds !== 0 ? 'font-semibold text-[#BE185D]' : ''}>
              {formatDelay(departure.delaySeconds as number)}
            </span>
          </span>
        ) : null}
      </span>
    </li>
  )
}
