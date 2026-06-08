'use client'

import Link from 'next/link'
import { WeatherGlyph } from './WeatherGlyph'
import type { WeatherIconKind } from '../types'

/**
 * Pastille météo de l'en-tête du guide : icône animée + température,
 * cliquable vers la page de prévisions complète.
 */
export function GuideWeatherBadge({
  citySlug,
  icon,
  temperature,
}: {
  citySlug: string
  icon: WeatherIconKind
  temperature: number
}) {
  return (
    <Link
      href={`/guide/${citySlug}/meteo`}
      aria-label={`Météo — voir les prévisions (${temperature}°)`}
      className="flex items-center gap-1.5 text-charcoal/80 transition-transform active:scale-95"
    >
      <WeatherGlyph icon={icon} size="medium" />
      <span className="text-lg font-light leading-none text-charcoal">{temperature}°</span>
    </Link>
  )
}
