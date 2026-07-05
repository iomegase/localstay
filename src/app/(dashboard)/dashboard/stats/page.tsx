import { StatsCharts } from '@/features/dashboard-owner/components/StatsCharts'

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-foreground">Statistiques</h1>
      <StatsCharts />
    </div>
  )
}
