'use client'

/* eslint-disable @next/next/no-img-element */

import type { DemoPoiCategory } from '@/features/guide-demo/types'

type DemoPoiImageProps = {
  category: DemoPoiCategory
  className: string
  decorative?: boolean
  name: string
  primarySrc?: string
}

const fallbackByCategory: Record<string, string> = {
  diner: '/fallback/fallback-restaurant.png',
  alimentation: '/fallback/fallback-alimentation.png',
  culture: '/fallback/fallback-culture.png',
  activite: '/fallback/fallback-transport.png',
  famille: '/fallback/fallback-famille.png',
  soin: '/fallback/fallback-cafe.png',
  rando: '/fallback/fallback-rando.png',
}

function getFallbackImage(category: DemoPoiCategory) {
  return fallbackByCategory[category.slug] ?? '/fallback/fallback-rando.png'
}

export function DemoPoiImage({
  category,
  className,
  decorative = false,
  name,
  primarySrc,
}: DemoPoiImageProps) {
  const fallback = getFallbackImage(category)
  const source = primarySrc || fallback

  return (
    <img
      src={source}
      alt={decorative ? '' : `Photo de ${name}`}
      onError={event => {
        if (event.currentTarget.getAttribute('src') !== fallback) {
          event.currentTarget.src = fallback
        }
      }}
      className={className}
    />
  )
}
