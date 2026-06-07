'use client'

import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'
import { formatWeatherClockLabel } from '@/features/weather/lib/weather-clock'
import type { WeatherForecast, WeatherIconKind } from '../types'

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

const cloudFloatVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const precipitationVariants: Variants = {
  animate: {
    y: [0, 5, 0],
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
      staggerChildren: 0.2,
    },
  },
}

const spinVariants: Variants = {
  animate: {
    rotate: [0, 360],
    transition: { duration: 15, repeat: Infinity, ease: 'linear' },
  },
}

const rainFallVariants: Variants = {
  animate: {
    y: [-5, 10],
    x: [2, -4],
    opacity: [0, 1, 0],
    transition: { duration: 1.2, repeat: Infinity, ease: 'linear', staggerChildren: 0.15 },
  },
}

const lightningVariants: Variants = {
  animate: {
    opacity: [0, 0, 1, 0, 1, 0, 0],
    scale: [1, 1, 1.1, 1, 1.1, 1, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'circIn',
      times: [0, 0.7, 0.75, 0.8, 0.85, 0.9, 1],
    },
  },
}

const windSweepVariants: Variants = {
  animate: {
    x: [-15, 5, -15],
    opacity: [0.3, 1, 0.3],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

const WEATHER_ICON_STROKE = '#68696d'
const WEATHER_ICON_MASK = '#f5f6f9'

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
    ? 'mt-4 h-[260px] shrink-0 px-6 pb-6'
    : 'mt-6 h-[110px] shrink-0 px-6 pb-7'

  return (
    <WeatherWidgetShell
      citySlug={citySlug}
      mode={mode}
      lodgingName={lodgingName}
      ownerName={ownerName}
      timeLabel={timeLabel}
    >
      <motion.div
        data-testid="weather-widget-main"
        variants={itemVariants}
        className="flex flex-1 flex-col justify-center px-6 text-center"
      >
        <div>
          <p className="text-[15px] font-light text-[#9b9ca0]">{forecast.current.dateLabel}</p>
          <h1 className="mt-4 text-[38px] font-[200] leading-none tracking-tight text-[#56575b]">
            {cityName}
          </h1>
          <p className="mt-1 text-[15px] font-light text-[#9b9ca0]">{forecast.current.condition}</p>
        </div>

        <div
          data-testid="weather-widget-current-icon"
          className="relative mt-12 mb-6 flex h-[120px] items-start justify-center pt-5"
        >
          <div className="absolute left-1/2  h-32 w-32  rounded-full bg-black/5 blur-xl" />
          <WeatherGlyph icon={forecast.current.icon} size="large" />
        </div>

        <div className="text-center">
          <h2 className="relative inline-block text-[52px] font-[200] leading-none text-[#56575b]">
            {forecast.current.temperature}
            <span className="absolute top-1 -right-6 text-[32px]">°</span>
          </h2>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative flex shrink-0 justify-center space-x-7 border-b border-transparent px-6">
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
              className="space-y-2 pr-1"
            >
              {forecast.daily.map(day => (
                <div
                  key={day.date}
                  data-testid="weather-widget-daily-row"
                  className="grid grid-cols-[1fr_auto] items-center gap-3 text-[12px] font-light"
                >
                  <div className="min-w-0">
                    <p className="truncate capitalize leading-none text-[#68696d]">{day.dayLabel}</p>
                    <p className="mt-1 truncate text-[10px] leading-none text-[#a2a3a7]">{day.condition}</p>
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
          <PublicMenu
            mode={mode}
            lodgingName={lodgingName}
            ownerName={ownerName}
            citySlug={citySlug}
          />
          <span className="text-sm font-light tracking-wide">{timeLabel}</span>
        </motion.div>

        {children}
      </motion.div>
    </div>
  )
}

function WeatherGlyph({ icon, size }: { icon: WeatherIconKind; size: 'large' | 'small' }) {
  const isLarge = size === 'large'
  const width = isLarge ? 120 : 24
  const height = isLarge ? 120 : 24
  const viewBox = isLarge ? '-10 -10 120 120' : '0 0 100 100'
  const strokeWidth = isLarge ? 4 : 5
  const className = isLarge
    ? 'relative z-10 overflow-visible drop-shadow-[5px_8px_8px_rgba(0,0,0,0.08)]'
    : 'mb-2 overflow-visible'

  return (
    <svg
      data-testid={`weather-icon-${icon}`}
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      overflow="visible"
      aria-hidden="true"
    >
      <WeatherIconShape icon={icon} strokeWidth={strokeWidth} />
    </svg>
  )
}

function WeatherIconShape({ icon, strokeWidth }: { icon: WeatherIconKind; strokeWidth: number }) {
  if (icon === 'sun') return <SunShape strokeWidth={strokeWidth} />
  if (icon === 'partly-cloudy') return <PartlyCloudyShape strokeWidth={strokeWidth} />
  if (icon === 'rain') return <RainShape strokeWidth={strokeWidth} />
  if (icon === 'snow') return <SnowShape strokeWidth={strokeWidth} />
  if (icon === 'fog') return <FogShape strokeWidth={strokeWidth} />
  if (icon === 'wind') return <WindShape strokeWidth={strokeWidth} />
  if (icon === 'storm') return <StormShape strokeWidth={strokeWidth} />
  if (icon === 'thunderstorm') return <ThunderstormShape strokeWidth={strokeWidth} />
  return (
    <motion.g variants={cloudFloatVariants} animate="animate">
      <CloudShape strokeWidth={strokeWidth} base="split" fill="none" />
    </motion.g>
  )
}

function CloudShape({
  strokeWidth,
  base,
  fill,
}: {
  strokeWidth: number
  base: 'split' | 'full'
  fill: string
}) {
  return (
    <g data-testid="weather-icon-cloud-shape">
      <path
        d="M 25 50 A 15 15 0 0 1 25 20 A 20 20 0 0 1 60 15 A 18 18 0 0 1 80 30 A 12 12 0 0 1 75 50"
        fill={fill}
        stroke={WEATHER_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d={base === 'full' ? 'M 25 50 L 75 50' : 'M 25 50 L 40 50 M 60 50 L 75 50'}
        fill="none"
        stroke={WEATHER_ICON_STROKE}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </g>
  )
}

function SunShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <motion.g variants={spinVariants} animate="animate" style={{ transformOrigin: 'center' }}>
      <circle cx="50" cy="50" r="18" fill="none" stroke={WEATHER_ICON_STROKE} strokeWidth={strokeWidth} />
      <g data-testid="weather-icon-sun-rays">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1="50"
            y1="22"
            x2="50"
            y2="12"
            stroke={WEATHER_ICON_STROKE}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
    </motion.g>
  )
}

function PartlyCloudyShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <>
      <motion.g
        data-testid="weather-icon-partly-sun"
        variants={spinVariants}
        animate="animate"
        style={{ transformOrigin: '65px 30px' }}
      >
        <circle cx="65" cy="30" r="12" fill="none" stroke={WEATHER_ICON_STROKE} strokeWidth={strokeWidth} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1="65"
            y1="12"
            x2="65"
            y2="6"
            stroke={WEATHER_ICON_STROKE}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            transform={`rotate(${angle} 65 30)`}
          />
        ))}
      </motion.g>
      <motion.g variants={cloudFloatVariants} animate="animate">
        <CloudShape strokeWidth={strokeWidth} base="full" fill={WEATHER_ICON_MASK} />
      </motion.g>
    </>
  )
}

function SnowShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <motion.g variants={cloudFloatVariants} animate="animate">
      <CloudShape strokeWidth={strokeWidth} base="split" fill={WEATHER_ICON_MASK} />
      <motion.g data-testid="weather-icon-snow-dots" variants={precipitationVariants} animate="animate">
        <circle cx="45" cy="58" r="2.5" fill={WEATHER_ICON_STROKE} />
        <circle cx="55" cy="58" r="2.5" fill={WEATHER_ICON_STROKE} />
        <circle cx="40" cy="68" r="2.5" fill={WEATHER_ICON_STROKE} />
        <circle cx="50" cy="68" r="2.5" fill={WEATHER_ICON_STROKE} />
        <circle cx="60" cy="68" r="2.5" fill={WEATHER_ICON_STROKE} />
      </motion.g>
    </motion.g>
  )
}

function RainShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <motion.g variants={cloudFloatVariants} animate="animate">
      <CloudShape strokeWidth={strokeWidth} base="split" fill={WEATHER_ICON_MASK} />
      <motion.g
        data-testid="weather-icon-rain-lines"
        variants={rainFallVariants}
        animate="animate"
        stroke={WEATHER_ICON_STROKE}
        strokeLinecap="round"
        strokeWidth="3"
      >
        <line x1="38" y1="55" x2="33" y2="70" />
        <line x1="50" y1="55" x2="45" y2="70" />
        <line x1="62" y1="55" x2="57" y2="70" />
      </motion.g>
    </motion.g>
  )
}

function FogShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <g data-testid="weather-icon-fog-lines" stroke={WEATHER_ICON_STROKE} strokeLinecap="round" strokeWidth={strokeWidth}>
      <path d="M34 60h32" />
      <path d="M28 68h44" />
    </g>
  )
}

function WindShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <motion.g
      data-testid="weather-icon-wind-lines"
      variants={windSweepVariants}
      animate="animate"
      stroke={WEATHER_ICON_STROKE}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    >
      <path d="M 20 30 Q 35 20 50 30 T 80 30" fill="none" />
      <path d="M 10 50 Q 25 40 40 50 T 90 50" fill="none" />
      <path d="M 30 70 Q 45 60 60 70 T 80 70" fill="none" />
      <circle cx="25" cy="40" r="2" fill={WEATHER_ICON_STROKE} stroke="none" />
      <circle cx="70" cy="60" r="2" fill={WEATHER_ICON_STROKE} stroke="none" />
    </motion.g>
  )
}

function ThunderstormShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <motion.g variants={cloudFloatVariants} animate="animate">
      <motion.path
        data-testid="weather-icon-lightning"
        variants={lightningVariants}
        d="M 45 45 L 35 65 L 48 65 L 42 85"
        fill="none"
        stroke={WEATHER_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <CloudShape strokeWidth={strokeWidth} base="split" fill={WEATHER_ICON_MASK} />
    </motion.g>
  )
}

function StormShape({ strokeWidth }: { strokeWidth: number }) {
  return (
    <motion.g variants={cloudFloatVariants} animate="animate">
      <motion.path
        data-testid="weather-icon-lightning"
        variants={lightningVariants}
        d="M 55 45 L 45 60 L 55 60 L 48 75"
        fill="none"
        stroke={WEATHER_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <CloudShape strokeWidth={strokeWidth} base="split" fill={WEATHER_ICON_MASK} />
      <motion.g
        data-testid="weather-icon-rain-lines"
        variants={rainFallVariants}
        animate="animate"
        stroke={WEATHER_ICON_STROKE}
        strokeLinecap="round"
        strokeWidth="3"
      >
        <line x1="38" y1="55" x2="33" y2="70" />
        <line x1="50" y1="55" x2="45" y2="70" />
        <line x1="62" y1="55" x2="57" y2="70" />
      </motion.g>
    </motion.g>
  )
}
