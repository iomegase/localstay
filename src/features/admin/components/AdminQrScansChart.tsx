'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'
import type { ChartConfig } from '@/shared/components/ui/chart'
import type { AdminDatePoint } from '@/features/admin/queries/dashboard'

const chartConfig: ChartConfig = {
  count: { label: 'Scans QR', color: 'hsl(var(--primary))' },
}

export function AdminQrScansChart({ series }: { series: AdminDatePoint[] }) {
  const chartData = series.map(point => ({
    date: point.date.slice(5),
    count: point.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Scans QR — 30 jours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full" data-testid="admin-qr-scans-chart">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} interval={6} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
