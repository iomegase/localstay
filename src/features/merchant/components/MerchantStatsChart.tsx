'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import type { ChartConfig } from '@/shared/components/ui/chart'
import type { MerchantStatsDto } from '../types'

const chartConfig: ChartConfig = {
  count: { label: 'Vues', color: 'hsl(var(--primary))' },
}

interface Props {
  stats: MerchantStatsDto
}

export function MerchantStatsChart({ stats }: Props) {
  const chartData = stats.views_series.map(point => ({
    date: point.date.slice(5),
    count: point.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vues fiche — 30 jours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full" data-testid="merchant-stats-chart">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={6} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
