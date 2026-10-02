/**
 * Point d'entrée du système de design MyStay pour Claude Design (/design-sync).
 * Réexporte les composants de présentation de l'app, sans accès serveur ni
 * Next.js runtime (pas de next/image, next/navigation, fetch au montage).
 */

// Shadcn/ui
export * from '../../src/shared/components/ui/accordion'
export * from '../../src/shared/components/ui/alert-dialog'
export * from '../../src/shared/components/ui/badge'
export * from '../../src/shared/components/ui/button'
export * from '../../src/shared/components/ui/card'
export * from '../../src/shared/components/ui/chart'
export * from '../../src/shared/components/ui/dialog'
export * from '../../src/shared/components/ui/input'
export * from '../../src/shared/components/ui/label'
export * from '../../src/shared/components/ui/select'
export * from '../../src/shared/components/ui/separator'
export * from '../../src/shared/components/ui/switch'
export * from '../../src/shared/components/ui/table'
export * from '../../src/shared/components/ui/textarea'

// Guide voyageur MyStay
export { GuideNavigation } from '../../src/features/guide-app/components/GuideNavigation'
export { GuideLodgingVideoButton } from '../../src/features/guide-app/components/GuideLodgingVideoButton'
export { GuideFavoriteBentoCard } from '../../src/features/guide-app/components/GuideFavoriteBentoCard'
export { MediaLightbox } from '../../src/features/guide-app/components/MediaLightbox'
export { GuideStayScreen } from '../../src/features/guide-app/components/stay/GuideStayScreen'
export { GuideStayHome } from '../../src/features/guide-app/components/stay/GuideStayHome'
export { GuideWifiSheet } from '../../src/features/guide-app/components/stay/GuideWifiSheet'
export { GuideArrivalFlow } from '../../src/features/guide-app/components/stay/GuideArrivalFlow'
export { GuideDepartureView } from '../../src/features/guide-app/components/stay/GuideDepartureView'
export { GuideHouseGuide } from '../../src/features/guide-app/components/stay/GuideHouseGuide'
export { GuideHelpView } from '../../src/features/guide-app/components/stay/GuideHelpView'
export { GuideSearchHeader, GuideSearchEmpty } from '../../src/features/guide-app/components/stay/GuideSearchHeader'
export { GuideLocationToggle } from '../../src/features/guide-app/components/stay/GuideLocationToggle'

// Se déplacer (Facilibus)
export { RoutePill } from '../../src/features/transport/components/RoutePill'
export { FacilibusDepartureRow } from '../../src/features/transport/components/FacilibusDepartureRow'
export { StationDistance } from '../../src/features/transport/components/StationDistance'
export { GuideTransportRow } from '../../src/features/transport/components/GuideTransportRow'
export { GuideTransportView } from '../../src/features/transport/components/GuideTransportView'

// Primitives Recharts utilisées avec ChartContainer dans l'app (graphiques du tableau de bord).
export { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
