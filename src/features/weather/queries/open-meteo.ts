import { z } from 'zod'
import type { WeatherDay, WeatherForecast, WeatherHour } from '../types'
import { getWeatherCodeDisplay } from '../lib/weather-code'

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
export const WEATHER_REVALIDATE_SECONDS = 1800

const openMeteoResponseSchema = z.object({
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    precipitation: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    weather_code: z.array(z.number()),
    precipitation_probability: z.array(z.number()),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number()),
  }),
})

type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>

export async function getOpenMeteoForecast({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}): Promise<WeatherForecast> {
  const url = new URL(OPEN_METEO_FORECAST_URL)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m,precipitation')
  url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability')
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('forecast_hours', '24')

  const response = await fetch(url.toString(), {
    next: { revalidate: WEATHER_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Open-Meteo indisponible (${response.status})`)
  }

  const payload: unknown = await response.json()
  const parsed = openMeteoResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error('Réponse Open-Meteo invalide')
  }

  return mapOpenMeteoForecast(parsed.data)
}

function mapOpenMeteoForecast(response: OpenMeteoResponse): WeatherForecast {
  const currentDisplay = getWeatherCodeDisplay(response.current.weather_code)

  return {
    timezone: response.timezone,
    current: {
      time: response.current.time,
      timeLabel: formatCurrentTime(response.current.time),
      dateLabel: formatDateLabel(response.current.time),
      temperature: Math.round(response.current.temperature_2m),
      condition: currentDisplay.label,
      icon: currentDisplay.icon,
      windSpeed: Math.round(response.current.wind_speed_10m),
      precipitation: response.current.precipitation,
    },
    hourly: response.hourly.time.map((time, index): WeatherHour => {
      const weatherCode = response.hourly.weather_code[index] ?? 0
      const display = getWeatherCodeDisplay(weatherCode)
      return {
        time,
        hourLabel: formatHourLabel(time),
        temperature: Math.round(response.hourly.temperature_2m[index] ?? 0),
        weatherCode,
        condition: display.label,
        icon: display.icon,
        precipitationProbability: response.hourly.precipitation_probability[index] ?? 0,
      }
    }),
    daily: response.daily.time.map((date, index): WeatherDay => {
      const display = getWeatherCodeDisplay(response.daily.weather_code[index] ?? 0)
      return {
        date,
        dayLabel: formatDayLabel(date),
        condition: display.label,
        icon: display.icon,
        temperatureMax: Math.round(response.daily.temperature_2m_max[index] ?? 0),
        temperatureMin: Math.round(response.daily.temperature_2m_min[index] ?? 0),
        precipitationProbability: response.daily.precipitation_probability_max[index] ?? 0,
      }
    }),
  }
}

function formatCurrentTime(value: string): string {
  return value.slice(11, 16)
}

function formatHourLabel(value: string): string {
  return `${value.slice(11, 13)}.00`
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function formatDayLabel(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date)
}
