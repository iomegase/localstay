/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import { WeatherScreen } from '@/features/weather/components/WeatherScreen'
import type { WeatherForecast } from '@/features/weather/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, 'aria-label': ariaLabel }: {
    href: string
    children: React.ReactNode
    className?: string
    'aria-label'?: string
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>{children}</a>
  ),
}))

const forecast: WeatherForecast = {
  timezone: 'Europe/Paris',
  current: {
    time: '2026-06-07T13:54',
    timeLabel: '13:54',
    dateLabel: 'dimanche 7 juin',
    temperature: 8,
    condition: 'Neige légère',
    icon: 'snow',
    windSpeed: 12,
    precipitation: 0.2,
  },
  hourly: [
    {
      time: '2026-06-07T14:00',
      hourLabel: '14.00',
      temperature: 8,
      weatherCode: 71,
      condition: 'Neige légère',
      icon: 'snow',
      precipitationProbability: 60,
    },
    {
      time: '2026-06-07T15:00',
      hourLabel: '15.00',
      temperature: 7,
      weatherCode: 61,
      condition: 'Pluie faible',
      icon: 'rain',
      precipitationProbability: 45,
    },
  ],
  daily: [
    {
      date: '2026-06-07',
      dayLabel: 'dimanche',
      condition: 'Neige légère',
      icon: 'snow',
      temperatureMax: 9,
      temperatureMin: 3,
      precipitationProbability: 70,
    },
    {
      date: '2026-06-08',
      dayLabel: 'lundi',
      condition: 'Couvert',
      icon: 'cloud',
      temperatureMax: 12,
      temperatureMin: 4,
      precipitationProbability: 25,
    },
  ],
}

describe('WeatherScreen — 025-weather', () => {
  it('renders the faithful mobile weather hero and forecast sections', () => {
    render(
      <WeatherScreen
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais-les-bains"
        forecast={forecast}
        mode="anonymous"
      />,
    )

    expect(screen.getByRole('link', { name: 'Retour au guide' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains',
    )
    expect(screen.getByText('13:54')).toBeInTheDocument()
    expect(screen.getByText('dimanche 7 juin')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Saint-Gervais-les-Bains' })).toBeInTheDocument()
    expect(screen.getAllByText('Neige légère').length).toBeGreaterThan(0)
    expect(screen.getAllByText('8°').length).toBeGreaterThan(0)
    expect(screen.getByTestId('weather-hero-icon')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: "Aujourd'hui" })).toHaveClass('text-[#5d5d5f]')
    expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 jours' })).toBeInTheDocument()

    const hourly = screen.getByTestId('weather-hourly-strip')
    expect(hourly).toHaveClass('overflow-x-auto')
    expect(within(hourly).getByText('14.00')).toBeInTheDocument()
    expect(within(hourly).getByText('7°')).toBeInTheDocument()

    const daily = screen.getByTestId('weather-daily-list')
    expect(within(daily).getByText('lundi')).toBeInTheDocument()
    expect(within(daily).getByText('4° / 12°')).toBeInTheDocument()
  })

  it('renders a readable error state when forecast is unavailable', () => {
    render(
      <WeatherScreen
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais-les-bains"
        forecast={null}
        mode="anonymous"
      />,
    )

    expect(screen.getByText('Météo indisponible')).toBeInTheDocument()
    expect(screen.getByText(/Réessayez dans quelques minutes/i)).toBeInTheDocument()
  })
})
