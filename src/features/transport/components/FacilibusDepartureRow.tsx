import { formatParisTime } from '../lib/time'
import { RoutePill } from './RoutePill'
import type { PublicDeparture } from '../types'

function formatDelay(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes === 0) return "À l'heure"
  return minutes > 0 ? `+${minutes} min` : `−${Math.abs(minutes)} min`
}

const STATUS_LABELS: Partial<Record<PublicDeparture['status'], string>> = {
  approaching: 'En approche',
  at_stop: "À l'arrêt",
}

/** Un passage : ligne, direction, horaire exploitable, écart et fraîcheur (spec 055 AC-02-04/05). */
export function FacilibusDepartureRow({ departure }: { departure: PublicDeparture }) {
  const statusLabel = STATUS_LABELS[departure.status]
  const showDelay = departure.realtime && departure.delaySeconds !== null

  return (
    <li className="flex items-center gap-3 py-3">
      <RoutePill route={departure.route} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-[#111111]">{departure.headsign}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#697386]">
          {statusLabel ? <span className="font-semibold text-[#BE185D]">{statusLabel}</span> : null}
          {departure.vehicleLocated ? <span>Navette en circulation</span> : null}
          {departure.realtime ? (
            <span className="rounded-full bg-[#FCE7F3] px-2 py-0.5 font-semibold text-[#BE185D]">Temps réel</span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <time dateTime={departure.referenceAt} className="block text-[17px] font-semibold tabular-nums text-[#111111]">
          {formatParisTime(departure.referenceAt)}
        </time>
        {showDelay ? (
          <span className="block text-[12px] tabular-nums text-[#697386]">
            {departure.delaySeconds !== 0 ? (
              <>
                <s aria-label={`Horaire prévu ${formatParisTime(departure.scheduledAt)}`}>{formatParisTime(departure.scheduledAt)}</s>{' '}
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
