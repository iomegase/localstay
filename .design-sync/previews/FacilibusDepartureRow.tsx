import { FacilibusDepartureRow } from '@mystay/design-system'

const l1 = { shortName: '1', color: '#228947', textColor: '#ffffff' }
const l2 = { shortName: '2', color: '#e72438', textColor: '#ffffff' }
const base = { scheduledAt: '2026-10-02T12:50:00.000Z', estimatedAt: null, referenceAt: '2026-10-02T12:50:00.000Z', delaySeconds: null, realtime: false, status: 'scheduled', vehicleLocated: false }

export const Departures = () => (
  <ul className="w-[340px] divide-y divide-[rgba(17,17,17,0.08)] rounded-[20px] bg-white px-4 shadow-[0_1px_2px_rgba(17,17,17,0.06)]">
    <FacilibusDepartureRow departure={{ ...base, id: 'a', headsign: 'Saint Nicolas de Véroce', route: l1 }} />
    <FacilibusDepartureRow departure={{ ...base, id: 'b', headsign: 'Les Pratz - Sporting Club', route: l2, scheduledAt: '2026-10-02T13:30:00.000Z', estimatedAt: '2026-10-02T13:32:00.000Z', referenceAt: '2026-10-02T13:32:00.000Z', delaySeconds: 120, realtime: true, vehicleLocated: true }} />
    <FacilibusDepartureRow departure={{ ...base, id: 'c', headsign: 'Saint Nicolas de Véroce', route: l1, scheduledAt: '2026-10-02T13:50:00.000Z', referenceAt: '2026-10-02T13:50:00.000Z', status: 'approaching', vehicleLocated: true }} />
  </ul>
)
