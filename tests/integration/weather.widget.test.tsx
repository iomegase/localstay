/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WeatherWidget from '@/features/weather/components/WeatherWidget'
import type { WeatherForecast, WeatherIconKind } from '@/features/weather/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, 'aria-label': ariaLabel, onClick }: {
    href: string
    children: React.ReactNode
    className?: string
    'aria-label'?: string
    onClick?: () => void
  }) => (
    <a href={href} className={className} aria-label={ariaLabel} onClick={onClick}>{children}</a>
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
      time: '2026-06-07T10:00',
      hourLabel: '10.00',
      temperature: 7,
      weatherCode: 71,
      condition: 'Neige légère',
      icon: 'snow',
      precipitationProbability: 60,
    },
    {
      time: '2026-06-07T12:00',
      hourLabel: '12.00',
      temperature: 9,
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
    {
      date: '2026-06-09',
      dayLabel: 'mardi',
      condition: 'Orage',
      icon: 'thunderstorm',
      temperatureMax: 18,
      temperatureMin: 13,
      precipitationProbability: 60,
    },
    {
      date: '2026-06-10',
      dayLabel: 'mercredi',
      condition: 'Couvert',
      icon: 'cloud',
      temperatureMax: 16,
      temperatureMin: 11,
      precipitationProbability: 20,
    },
    {
      date: '2026-06-11',
      dayLabel: 'jeudi',
      condition: 'Couvert',
      icon: 'cloud',
      temperatureMax: 21,
      temperatureMin: 8,
      precipitationProbability: 15,
    },
    {
      date: '2026-06-12',
      dayLabel: 'vendredi',
      condition: 'Pluie faible',
      icon: 'rain',
      temperatureMax: 15,
      temperatureMin: 10,
      precipitationProbability: 50,
    },
    {
      date: '2026-06-13',
      dayLabel: 'samedi',
      condition: 'Peu nuageux',
      icon: 'partly-cloudy',
      temperatureMax: 22,
      temperatureMin: 12,
      precipitationProbability: 10,
    },
  ],
}

function forecastWithCurrentIcon(icon: WeatherIconKind): WeatherForecast {
  return {
    ...forecast,
    current: {
      ...forecast.current,
      icon,
    },
  }
}

describe('WeatherWidget — 025-weather', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-06-07T11:30:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the Open-Meteo forecast data inside the new widget design', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    render(
      <WeatherWidget
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais-les-bains"
        forecast={forecast}
        mode="anonymous"
      />,
    )

    expect(screen.getByTestId('weather-widget-shell')).toHaveClass('h-screen', 'w-full', 'overflow-hidden')
    expect(screen.getByTestId('weather-widget-shell')).not.toHaveClass('items-center', 'justify-center', 'p-4')
    expect(screen.getByTestId('weather-widget')).toBeInTheDocument()
    expect(screen.getByTestId('weather-widget')).toHaveClass('h-screen', 'w-full')
    expect(screen.getByTestId('weather-widget')).not.toHaveClass('rounded-[2rem]', 'shadow-[0_20px_50px_rgba(0,0,0,0.15)]')
    expect(screen.getByTestId('weather-widget-nav')).toHaveClass('shrink-0')
    expect(screen.getByTestId('weather-widget-main')).toHaveClass('flex-1', 'justify-center')
    expect(screen.getByTestId('weather-widget-current-icon')).toHaveClass('h-[120px]', 'pt-5')
    expect(screen.getByTestId('weather-widget-current-icon')).not.toHaveClass('translate-y-5')
    const currentIcon = within(screen.getByTestId('weather-widget-current-icon')).getByTestId('weather-icon-snow')
    expect(currentIcon).toHaveClass('overflow-visible')
    expect(currentIcon).toHaveAttribute('viewBox', '-10 -10 120 120')
    expect(currentIcon).toHaveAttribute('height', '120')
    await waitFor(() => expect(screen.getByText('13:30')).toBeInTheDocument())
    expect(screen.queryByText('13:54')).not.toBeInTheDocument()
    expect(screen.getByText('dimanche 7 juin')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Saint-Gervais-les-Bains' })).toBeInTheDocument()
    expect(screen.getAllByText('Neige légère').length).toBeGreaterThan(0)
    expect(screen.getByText((_, element) => element?.tagName === 'H2' && element.textContent === '8°')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByTestId('weather-widget-daily')).toBeInTheDocument())
    expect(screen.getByTestId('weather-widget-forecast-panel')).toHaveClass('h-[260px]')
    const daily = screen.getByTestId('weather-widget-daily')
    expect(daily).toHaveClass('space-y-2')
    expect(daily).not.toHaveClass('max-h-[96px]', 'overflow-y-auto')
    expect(within(daily).getAllByTestId('weather-widget-daily-row')).toHaveLength(7)
    expect(within(daily).getByText('lundi')).toBeInTheDocument()
    expect(within(daily).getByText('4° / 12°')).toBeInTheDocument()
    expect(within(daily).getByText('samedi')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "Aujourd'hui" }))
    await waitFor(() => expect(screen.getByTestId('weather-widget-hourly')).toBeInTheDocument())
    const hourly = screen.getByTestId('weather-widget-hourly')
    expect(within(hourly).getByText('10.00')).toBeInTheDocument()
    expect(within(hourly).getByText('7°')).toBeInTheDocument()
  })

  it('renders the animated SVG family for each weather icon kind', () => {
    const iconCases: Array<{ icon: WeatherIconKind; shapeTestId: string }> = [
      { icon: 'sun', shapeTestId: 'weather-icon-sun-rays' },
      { icon: 'partly-cloudy', shapeTestId: 'weather-icon-partly-sun' },
      { icon: 'cloud', shapeTestId: 'weather-icon-cloud-shape' },
      { icon: 'rain', shapeTestId: 'weather-icon-rain-lines' },
      { icon: 'snow', shapeTestId: 'weather-icon-snow-dots' },
      { icon: 'fog', shapeTestId: 'weather-icon-fog-lines' },
      { icon: 'wind', shapeTestId: 'weather-icon-wind-lines' },
      { icon: 'storm', shapeTestId: 'weather-icon-lightning' },
      { icon: 'thunderstorm', shapeTestId: 'weather-icon-lightning' },
    ]

    const { rerender } = render(
      <WeatherWidget
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais-les-bains"
        forecast={forecastWithCurrentIcon(iconCases[0].icon)}
        mode="anonymous"
      />,
    )

    for (const { icon, shapeTestId } of iconCases) {
      rerender(
        <WeatherWidget
          cityName="Saint-Gervais-les-Bains"
          citySlug="saint-gervais-les-bains"
          forecast={forecastWithCurrentIcon(icon)}
          mode="anonymous"
        />,
      )

      const main = screen.getByTestId('weather-widget-main')
      expect(within(main).getByTestId(`weather-icon-${icon}`)).toBeInTheDocument()
      expect(within(main).getByTestId(shapeTestId)).toBeInTheDocument()
    }
  })

  it('renders the same readable fallback state as the weather page', () => {
    render(
      <WeatherWidget
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
