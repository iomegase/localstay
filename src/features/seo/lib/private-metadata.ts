import type { Metadata } from 'next'

export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  noarchive: true,
} as const

export function privatePageMetadata(title: string): Metadata {
  return { title, robots: PRIVATE_ROBOTS }
}
