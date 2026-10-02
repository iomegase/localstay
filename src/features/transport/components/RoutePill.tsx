import type { PublicRoute } from '../types'

/** Pastille de ligne aux couleurs officielles publiées par le réseau (GTFS). */
export function RoutePill({ route }: { route: Pick<PublicRoute, 'shortName' | 'color' | 'textColor'> }) {
  return (
    <span
      className="grid h-8 min-w-8 shrink-0 place-items-center rounded-lg px-1.5 text-[13px] font-bold"
      style={{ backgroundColor: route.color ?? '#111111', color: route.textColor ?? '#ffffff' }}
      aria-label={`Ligne ${route.shortName}`}
    >
      {route.shortName}
    </span>
  )
}
