import { getOpenMeteoForecast } from '@/features/weather/queries/open-meteo'

const openMeteoResponse = {
  timezone: 'Europe/Paris',
  current: {
    time: '2026-06-07T13:54',
    temperature_2m: 8.4,
    weather_code: 71,
    wind_speed_10m: 12,
    precipitation: 0.2,
  },
  hourly: {
    time: ['2026-06-07T14:00', '2026-06-07T15:00'],
    temperature_2m: [8.2, 7.8],
    weather_code: [71, 61],
    precipitation_probability: [60, 45],
  },
  daily: {
    time: ['2026-06-07', '2026-06-08'],
    weather_code: [71, 3],
    temperature_2m_max: [9, 12],
    temperature_2m_min: [3, 4],
    precipitation_probability_max: [70, 25],
  },
}

describe('getOpenMeteoForecast', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(openMeteoResponse),
    }) as jest.Mock
  })

  it('calls Open-Meteo with the approved forecast parameters and 30 minute cache', async () => {
    await getOpenMeteoForecast({ latitude: 45.892, longitude: 6.713 })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = (fetch as jest.Mock).mock.calls[0] as [string, RequestInit & { next?: { revalidate?: number } }]
    const parsedUrl = new URL(url)

    expect(parsedUrl.origin).toBe('https://api.open-meteo.com')
    expect(parsedUrl.pathname).toBe('/v1/forecast')
    expect(parsedUrl.searchParams.get('latitude')).toBe('45.892')
    expect(parsedUrl.searchParams.get('longitude')).toBe('6.713')
    expect(parsedUrl.searchParams.get('current')).toBe('temperature_2m,weather_code,wind_speed_10m,precipitation')
    expect(parsedUrl.searchParams.get('hourly')).toBe('temperature_2m,weather_code,precipitation_probability')
    expect(parsedUrl.searchParams.get('daily')).toBe('weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
    expect(parsedUrl.searchParams.get('timezone')).toBe('auto')
    expect(parsedUrl.searchParams.get('forecast_days')).toBe('7')
    expect(parsedUrl.searchParams.get('forecast_hours')).toBe('24')
    expect(options.next?.revalidate).toBe(1800)
  })

  it('maps current, hourly and daily forecasts to display-ready data', async () => {
    const forecast = await getOpenMeteoForecast({ latitude: 45.892, longitude: 6.713 })

    expect(forecast.current.temperature).toBe(8)
    expect(forecast.current.condition).toBe('Neige légère')
    expect(forecast.current.timeLabel).toBe('13:54')
    expect(forecast.current.dateLabel).toBe('dimanche 7 juin')
    expect(forecast.hourly).toHaveLength(2)
    expect(forecast.hourly[0]).toMatchObject({
      hourLabel: '14.00',
      temperature: 8,
      condition: 'Neige légère',
      precipitationProbability: 60,
    })
    expect(forecast.daily[1]).toMatchObject({
      dayLabel: 'lundi',
      condition: 'Couvert',
      temperatureMax: 12,
      temperatureMin: 4,
      precipitationProbability: 25,
    })
  })

  it('throws a readable error when Open-Meteo returns an invalid response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ current: null }),
    }) as jest.Mock

    await expect(getOpenMeteoForecast({ latitude: 45.892, longitude: 6.713 })).rejects.toThrow(
      'Réponse Open-Meteo invalide',
    )
  })
})
