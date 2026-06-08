'use client'

import { motion, type Variants } from 'framer-motion'
import type { WeatherIconKind } from '../types'

const WEATHER_ICON_STROKE = '#68696d'
const WEATHER_ICON_MASK = '#f5f6f9'

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

export type WeatherGlyphSize = 'large' | 'medium' | 'small'

const SIZE_CONFIG: Record<WeatherGlyphSize, { px: number; viewBox: string; strokeWidth: number }> = {
  large: { px: 120, viewBox: '-10 -10 120 120', strokeWidth: 4 },
  medium: { px: 34, viewBox: '0 0 100 100', strokeWidth: 5 },
  small: { px: 24, viewBox: '0 0 100 100', strokeWidth: 5 },
}

export function WeatherGlyph({ icon, size }: { icon: WeatherIconKind; size: WeatherGlyphSize }) {
  const { px, viewBox, strokeWidth } = SIZE_CONFIG[size]
  const className =
    size === 'large'
      ? 'relative z-10 overflow-visible drop-shadow-[5px_8px_8px_rgba(0,0,0,0.08)]'
      : size === 'small'
        ? 'mb-2 overflow-visible'
        : 'overflow-visible'

  return (
    <svg
      data-testid={`weather-icon-${icon}`}
      width={px}
      height={px}
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
