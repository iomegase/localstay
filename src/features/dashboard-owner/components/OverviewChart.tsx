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

interface ScanDay {
  date: string
  count: number
}

const chartConfig: ChartConfig = {
  count: { label: 'Scans', color: 'hsl(var(--primary))' },
}

export function OverviewChart() {
  const [data, setData] = useState<ScanDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats?days=30')
      .then(r => r.json())
      .then(json => setData(json.scans_by_day ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-[200px] animate-pulse bg-muted rounded-lg" />
  }

  const display = data.map(d => ({
    date: d.date.slice(5),
    count: d.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Scans QR — 30 derniers jours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={display}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval={6}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
