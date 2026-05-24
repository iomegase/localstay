/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminQrScansChart } from '@/features/admin/components/AdminQrScansChart'

jest.mock('recharts', () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))

describe('016 admin QR scans chart', () => {
  it('AC-02-02: renders a 30-day QR scan chart', () => {
    const series = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-05-${String(index + 1).padStart(2, '0')}`,
      count: index,
    }))

    render(<AdminQrScansChart series={series} />)

    expect(screen.getByText('Scans QR — 30 jours')).toBeInTheDocument()
    expect(screen.getByTestId('admin-qr-scans-chart')).toBeInTheDocument()
  })
})
