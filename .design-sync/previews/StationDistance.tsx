import { StationDistance } from '@mystay/design-system'

export const Walking = () => (
  <StationDistance station={{ name: 'Télécabine de Saint Gervais / Le Chatelet', distanceMeters: 105, travel: { walkingSeconds: 150, drivingSeconds: 90 } }} />
)

export const CrowFlyFallback = () => (
  <StationDistance station={{ name: 'La Comtesse', distanceMeters: 640, travel: null }} />
)
