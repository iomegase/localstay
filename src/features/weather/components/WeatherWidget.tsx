'use client'

import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'
import { formatWeatherClockLabel } from '@/features/weather/lib/weather-clock'
import { WeatherGlyph } from './WeatherGlyph'
import type { WeatherForecast } from '../types'

type WeatherWidgetTab = 'today' | 'hours' | 'week'

const tabs: Array<{ id: WeatherWidgetTab; label: string }> = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'hours', label: '24h' },
  { id: 'week', label: '7 jours' },
]

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function WeatherWidget({
  cityName,
  citySlug,
  forecast,
  initialTimeLabel,
  mode,
  lodgingName,
  ownerName,
}: {
  cityName: string
  citySlug: string
  forecast: WeatherForecast | null
  initialTimeLabel?: string
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
}) {
  const [activeTab, setActiveTab] = useState<WeatherWidgetTab>('week')
  const timeLabel = useWeatherClockLabel(forecast?.timezone ?? null, initialTimeLabel ?? forecast?.current.timeLabel ?? '--:--')

  useWeatherViewportLock()

  if (!forecast) {
    return (
      <WeatherWidgetShell
        citySlug={citySlug}
        mode={mode}
        lodgingName={lodgingName}
        ownerName={ownerName}
        timeLabel={timeLabel}
      >
        <motion.div variants={itemVariants} className="flex flex-1  flex-col items-center justify-center px-8 text-center">
          <WeatherGlyph icon="cloud" size="large" />
          <h1 className="mt-10 text-[30px] font-[200] leading-tight text-[#56575b]">Météo indisponible</h1>
          <p className="mt-4 text-[13px] font-light leading-6 text-[#9b9ca0]">
            Réessayez dans quelques minutes. Les prévisions ne sont pas disponibles pour le moment.
          </p>
        </motion.div>
      </WeatherWidgetShell>
    )
  }

  const visibleHours = forecast.hourly.slice(0, activeTab === 'hours' ? 8 : 5)
  const forecastPanelClassName = activeTab === 'week'
    ? 'mt-3 h-[196px] shrink-0 px-6'
    : 'mt-5 h-[112px] shrink-0 px-6'

  return (
    <WeatherWidgetShell
      citySlug={citySlug}
      mode={mode}
      lodgingName={lodgingName}
      ownerName={ownerName}
      timeLabel={timeLabel}
    >
      <div
        data-testid="weather-widget-content"
        className="flex min-h-0 flex-1 flex-col justify-center pb-5 pt-3"
      >
        <motion.div
          data-testid="weather-widget-main"
          variants={itemVariants}
          className="shrink-0 px-6 text-center"
        >
          <div>
            <p className="text-[15px] font-light text-[#9b9ca0]">{forecast.current.dateLabel}</p>
            <h1 className="mt-3 text-[34px] font-[200] leading-none tracking-tight text-[#56575b]">
              {cityName}
            </h1>
            <p className="mt-1 text-[15px] font-light text-[#9b9ca0]">{forecast.current.condition}</p>
          </div>

          <div
            data-testid="weather-widget-current-icon"
            className="relative mt-6 mb-3 flex h-[120px] items-start justify-center pt-5"
          >
            <div className="absolute left-1/2 h-32 w-32 rounded-full bg-black/5 blur-xl" />
            <WeatherGlyph icon={forecast.current.icon} size="large" />
          </div>

          <div className="text-center">
            <h2 className="relative inline-block text-[46px] font-[200] leading-none text-[#56575b]">
              {forecast.current.temperature}
              <span className="absolute top-1 -right-6 text-[32px]">°</span>
            </h2>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative mt-5 flex shrink-0 justify-center space-x-7 border-b border-transparent px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-[14px] font-light transition-colors ${
                activeTab === tab.id ? 'text-[#56575b]' : 'text-[#a2a3a7]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#56575b]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        <div data-testid="weather-widget-forecast-panel" className={forecastPanelClassName}>
          <AnimatePresence mode="wait">
            {activeTab === 'week' ? (
              <motion.div
                key="week"
                data-testid="weather-widget-daily"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-1.5 pr-1"
              >
                {forecast.daily.map(day => (
                  <div
                    key={day.date}
                    data-testid="weather-widget-daily-row"
                    className="grid grid-cols-[1fr_auto] items-center gap-3 text-[11px] font-light"
                  >
                    <div className="min-w-0">
                      <p className="truncate capitalize leading-none text-[#68696d]">{day.dayLabel}</p>
                      <p className="mt-0.5 truncate text-[9px] leading-none text-[#a2a3a7]">{day.condition}</p>
                    </div>
                    <p className="text-[#68696d]">{day.temperatureMin}° / {day.temperatureMax}°</p>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                data-testid="weather-widget-hourly"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {visibleHours.map((hour, index) => (
                  <motion.div
                    key={hour.time}
                    className="flex min-w-[42px] flex-col items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="mb-3 text-[11px] font-light text-[#a2a3a7]">{hour.hourLabel}</span>
                    <WeatherGlyph icon={hour.icon} size="small" />
                    <span className="mt-2 text-[13px] font-light text-[#68696d]">{hour.temperature}°</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WeatherWidgetShell>
  )
}

function useWeatherClockLabel(timeZone: string | null, fallbackLabel: string) {
  const [timeLabel, setTimeLabel] = useState(fallbackLabel)

  useEffect(() => {
    setTimeLabel(fallbackLabel)
  }, [fallbackLabel])

  useEffect(() => {
    if (!timeZone) return

    const updateTime = () => {
      setTimeLabel(formatWeatherClockLabel(timeZone))
    }

    updateTime()
    const intervalId = window.setInterval(updateTime, 60_000)
    return () => window.clearInterval(intervalId)
  }, [timeZone])

  return timeLabel
}

function useWeatherViewportLock() {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    root.classList.add('overflow-hidden')
    body.classList.add('overflow-hidden')
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0)
    }

    return () => {
      root.classList.remove('overflow-hidden')
      body.classList.remove('overflow-hidden')
    }
  }, [])
}

function WeatherWidgetShell({
  children,
  citySlug,
  mode,
  lodgingName,
  ownerName,
  timeLabel,
}: {
  children: React.ReactNode
  citySlug: string
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
  timeLabel: string
}) {
  return (
    <div
      data-testid="weather-widget-shell"
      className="h-screen w-full overflow-hidden bg-gradient-to-b from-[#f9fafe] to-[#e8e9f0] font-sans selection:bg-gray-200"
    >
      <motion.div
        data-testid="weather-widget"
        className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-[#f9fafe] to-[#e8e9f0]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          data-testid="weather-widget-nav"
          variants={itemVariants}
          className="flex shrink-0 items-center justify-between px-7 pt-8 text-[#9b9ca0]"
        >
          <span data-testid="weather-widget-clock" className="text-sm font-light tracking-wide">{timeLabel}</span>
          <div data-testid="weather-widget-menu-slot" className="flex justify-end">
            <PublicMenu
              mode={mode}
              lodgingName={lodgingName}
              ownerName={ownerName}
              citySlug={citySlug}
            />
          </div>
        </motion.div>

        {children}
      </motion.div>
    </div>
  )
}
