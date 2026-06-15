/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import WeatherPage from '@/app/(weather)/guide/[city-slug]/meteo/page'
import { getWeatherCity } from '@/features/weather/queries/weather-city'
import { getOpenMeteoForecast } from '@/features/weather/queries/open-meteo'

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  usePathname: () => '/guide/saint-gervais-les-bains/meteo',
}))

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

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/features/weather/queries/weather-city', () => ({
  getWeatherCity: jest.fn(),
}))

jest.mock('@/features/weather/queries/open-meteo', () => ({
  getOpenMeteoForecast: jest.fn(),
}))

const forecast = {
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
  hourly: [],
  daily: [],
}

describe('/guide/[city-slug]/meteo', () => {
  beforeEach(() => {
    mockNotFound.mockClear()
    ;(getWeatherCity as jest.Mock).mockResolvedValue({
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      latitude: 45.892,
      longitude: 6.713,
    })
    ;(getOpenMeteoForecast as jest.Mock).mockResolvedValue(forecast)
  })

  it('loads the City coordinates and renders the weather screen', async () => {
    const jsx = await WeatherPage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) })
    render(jsx)

    expect(getWeatherCity).toHaveBeenCalledWith('saint-gervais-les-bains')
    expect(getOpenMeteoForecast).toHaveBeenCalledWith({ latitude: 45.892, longitude: 6.713 })
    expect(screen.getByTestId('weather-widget')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Saint-Gervais-les-Bains' })).toBeInTheDocument()
  })

  it('returns 404 when the City is missing', async () => {
    ;(getWeatherCity as jest.Mock).mockResolvedValue(null)

    await WeatherPage({ params: Promise.resolve({ 'city-slug': 'inconnue' }) })

    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })

  it('renders the fallback state when Open-Meteo fails', async () => {
    ;(getOpenMeteoForecast as jest.Mock).mockRejectedValue(new Error('network'))

    const jsx = await WeatherPage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) })
    render(jsx)

    expect(screen.getByText('Météo indisponible')).toBeInTheDocument()
  })
})
