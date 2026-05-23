'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { ChartConfig } from '@/shared/components/ui/chart'
import type { DashboardStats } from '../queries/stats'

const chartConfig: ChartConfig = {
  count: { label: 'Scans', color: 'hsl(var(--primary))' },
}

export function StatsCharts() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats?days=30')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[200px] animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const chartData = data.scans_by_day.map(d => ({
    date: d.date.slice(5),
    count: d.count,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Scans QR par jour — 30 jours</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={6} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 catégories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ul className="space-y-2">
                {data.top_categories.map((cat, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{cat.name}</span>
                    <span className="text-muted-foreground font-medium">{cat.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 10 POI cliqués</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_pois.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ul className="space-y-2">
                {data.top_pois.map((poi, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate max-w-[160px]">{poi.name}</span>
                    <span className="text-muted-foreground font-medium">{poi.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
