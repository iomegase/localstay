import { RoutePill } from '@mystay/design-system'

export const Lines = () => (
  <div className="flex items-center gap-3">
    <RoutePill route={{ shortName: '1', color: '#228947', textColor: '#ffffff' }} />
    <RoutePill route={{ shortName: '2', color: '#e72438', textColor: '#ffffff' }} />
  </div>
)
