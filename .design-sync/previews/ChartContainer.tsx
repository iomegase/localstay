import { Bar, BarChart, CartesianGrid, ChartContainer, ChartTooltip, ChartTooltipContent, Line, LineChart, XAxis } from '@mystay/design-system'

const scans = [
  { day: 'Lun', count: 12 }, { day: 'Mar', count: 18 }, { day: 'Mer', count: 9 },
  { day: 'Jeu', count: 22 }, { day: 'Ven', count: 31 }, { day: 'Sam', count: 44 }, { day: 'Dim', count: 27 },
]

export const BarScans = () => (
  <ChartContainer config={{ count: { label: 'Scans', color: '#DB2777' } }} className="h-[200px] w-[480px]">
    <BarChart data={scans}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="day" tickLine={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ChartContainer>
)

export const LineScans = () => (
  <ChartContainer config={{ count: { label: 'Scans', color: '#111111' } }} className="h-[200px] w-[480px]">
    <LineChart data={scans}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="day" tickLine={false} axisLine={false} />
      <Line dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} isAnimationActive={false} />
    </LineChart>
  </ChartContainer>
)
