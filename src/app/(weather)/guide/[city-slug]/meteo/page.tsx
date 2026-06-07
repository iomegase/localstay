import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import WeatherWidget from '@/features/weather/components/WeatherWidget'
import { formatWeatherClockLabel } from '@/features/weather/lib/weather-clock'
import { getOpenMeteoForecast } from '@/features/weather/queries/open-meteo'
import { getWeatherCity } from '@/features/weather/queries/weather-city'

type Props = {
  params: Promise<{ 'city-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const city = await getWeatherCity(citySlug)
  if (!city) return { title: 'Météo introuvable', robots: { index: false } }

  return {
    title: `Météo ${city.name}`,
    description: `Prévisions météo 24h et 7 jours pour ${city.name}.`,
    alternates: { canonical: `/guide/${city.slug}/meteo` },
  }
}

export default async function WeatherPage({ params }: Props) {
  const { 'city-slug': citySlug } = await params
  const [city, lodgingContext] = await Promise.all([
    getWeatherCity(citySlug),
    getActiveLodgingContext(),
  ])

  if (!city) {
    notFound()
    return null
  }

  const forecast = await getForecastOrNull(city.latitude, city.longitude)
  const mode = lodgingContext ? 'lodging' : 'anonymous'
  const initialTimeLabel = forecast ? formatWeatherClockLabel(forecast.timezone) : '--:--'

  return (
    <WeatherWidget
      cityName={city.name}
      citySlug={city.slug}
      forecast={forecast}
      initialTimeLabel={initialTimeLabel}
      mode={mode}
      lodgingName={lodgingContext?.lodgingName ?? null}
      ownerName={lodgingContext?.ownerName ?? null}
    />
  )
}

async function getForecastOrNull(latitude: number, longitude: number) {
  try {
    return await getOpenMeteoForecast({ latitude, longitude })
  } catch {
    return null
  }
}
