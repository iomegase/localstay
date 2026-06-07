'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind } from 'lucide-react'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'
import type { WeatherForecast, WeatherIconKind } from '../types'

type WeatherTab = 'today' | 'hours' | 'week'

export function WeatherScreen({
  cityName,
  citySlug,
  forecast,
  mode,
  lodgingName,
  ownerName,
}: {
  cityName: string
  citySlug: string
  forecast: WeatherForecast | null
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
}) {
  const [activeTab, setActiveTab] = useState<WeatherTab>('today')

  if (!forecast) {
    return (
      <WeatherFrame
        cityName={cityName}
        citySlug={citySlug}
        timeLabel="--:--"
        mode={mode}
        lodgingName={lodgingName}
        ownerName={ownerName}
      >
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
          <Cloud className="mb-8 h-24 w-24 text-[#77777a]" strokeWidth={1.5} />
          <h1 className="text-3xl font-light text-[#5d5d5f]">Météo indisponible</h1>
          <p className="mt-4 text-sm font-light leading-7 text-[#9a9aa0]">
            Réessayez dans quelques minutes. Les prévisions ne sont pas disponibles pour le moment.
          </p>
        </div>
      </WeatherFrame>
    )
  }

  return (
    <WeatherFrame
      cityName={cityName}
      citySlug={citySlug}
      timeLabel={forecast.current.timeLabel}
      mode={mode}
      lodgingName={lodgingName}
      ownerName={ownerName}
    >
      <section className="px-8 pt-4 text-center">
        <p className="text-[28px] font-light text-[#b7b7bd]">{forecast.current.dateLabel}</p>

        <div className="mt-16">
          <h1 className="text-[54px] font-light leading-none tracking-normal text-[#5d5d5f]">
            {cityName}
          </h1>
          <p className="mt-2 text-[32px] font-light leading-none text-[#b4b4ba]">
            {forecast.current.condition}
          </p>
        </div>

        <div className="mt-32 flex flex-col items-center">
          <div className="relative h-40 w-52" data-testid="weather-hero-icon">
            <div className="absolute left-[104px] top-10 h-28 w-28 rotate-45 bg-[#d9d9e4]/70 blur-[1px]" />
            <WeatherSymbol
              icon={forecast.current.icon}
              className="relative z-10 h-40 w-52 text-[#606064]"
              strokeWidth={1.55}
            />
          </div>
          <p className="mt-10 text-[72px] font-light leading-none text-[#5d5d5f]">
            {forecast.current.temperature}°
          </p>
        </div>
      </section>

      <section className="mt-36 px-8">
        <div className="grid grid-cols-3 items-end text-center text-[28px] font-light text-[#b8b8be]">
          <WeatherTabButton active={activeTab === 'today'} onClick={() => setActiveTab('today')}>
            Aujourd&apos;hui
          </WeatherTabButton>
          <WeatherTabButton active={activeTab === 'hours'} onClick={() => setActiveTab('hours')}>
            24h
          </WeatherTabButton>
          <WeatherTabButton active={activeTab === 'week'} onClick={() => setActiveTab('week')}>
            7 jours
          </WeatherTabButton>
        </div>

        <div
          data-testid="weather-hourly-strip"
          className="mt-10 flex gap-9 overflow-x-auto pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {forecast.hourly.map(hour => (
            <div key={hour.time} className="flex min-w-[58px] flex-col items-center text-center">
              <p className="text-[18px] font-light text-[#b4b4ba]">{hour.hourLabel}</p>
              <WeatherSymbol icon={hour.icon} className="mt-5 h-12 w-12 text-[#66666a]" strokeWidth={1.55} />
              <p className="mt-4 text-[20px] font-light text-[#aaaab0]">{hour.temperature}°</p>
            </div>
          ))}
        </div>

        <div
          data-testid="weather-daily-list"
          className={`mt-4 space-y-4 pb-12 transition-opacity duration-200 ${
            activeTab === 'week' ? 'opacity-100' : 'opacity-70'
          }`}
        >
          {forecast.daily.map(day => (
            <div
              key={day.date}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-[#e7e7ee] pt-4"
            >
              <div className="min-w-0 text-left">
                <p className="text-[17px] font-light capitalize text-[#77777d]">{day.dayLabel}</p>
                <p className="truncate text-[12px] font-light text-[#b0b0b6]">{day.condition}</p>
              </div>
              <WeatherSymbol icon={day.icon} className="h-8 w-8 text-[#77777d]" strokeWidth={1.55} />
              <div className="text-right">
                <p className="text-[16px] font-light text-[#77777d]">
                  {day.temperatureMin}° / {day.temperatureMax}°
                </p>
                <p className="text-[11px] font-light text-[#b0b0b6]">{day.precipitationProbability}% pluie</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </WeatherFrame>
  )
}

function WeatherFrame({
  children,
  citySlug,
  timeLabel,
  mode,
  lodgingName,
  ownerName,
}: {
  children: React.ReactNode
  cityName: string
  citySlug: string
  timeLabel: string
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
}) {
  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#5d5d5f] shadow-2xl">
      <header className="flex items-center justify-between px-10 pt-12">
        <div className="flex items-center gap-5">
          <PublicMenu
            mode={mode}
            lodgingName={lodgingName}
            ownerName={ownerName}
            citySlug={citySlug}
          />
          <Link
            href={`/guide/${citySlug}`}
            aria-label="Retour au guide"
            className="flex h-10 w-10 items-center justify-center text-[#78787d] transition-colors hover:text-[#444448]"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
          </Link>
        </div>
        <time className="text-[28px] font-light text-[#9b9ba2]">{timeLabel}</time>
      </header>
      {children}
    </div>
  )
}

function WeatherTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-4 text-center transition-colors ${
        active ? 'text-[#5d5d5f]' : 'text-[#b8b8be] hover:text-[#8b8b91]'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-[2px] w-20 -translate-x-1/2 bg-[#727277]" />
      )}
    </button>
  )
}

function WeatherSymbol({
  icon,
  className,
  strokeWidth,
}: {
  icon: WeatherIconKind
  className: string
  strokeWidth: number
}) {
  const props = { className, strokeWidth }
  if (icon === 'sun') return <Sun {...props} />
  if (icon === 'partly-cloudy') return <CloudSun {...props} />
  if (icon === 'fog') return <CloudFog {...props} />
  if (icon === 'rain') return <CloudRain {...props} />
  if (icon === 'snow') return <CloudSnow {...props} />
  if (icon === 'wind') return <Wind {...props} />
  if (icon === 'storm' || icon === 'thunderstorm') return <CloudLightning {...props} />
  return <Cloud {...props} />
}
