'use client'

const STORAGE_KEY = 'mystay.favorites'
const EVENT_NAME = 'mystay-favorites-changed'

export type FavoritePoi = {
  poi_id: string
  name: string
  city_slug: string
  category_slug: string
  poi_slug: string
  photo: string | null
  added_at: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readFavorites(): FavoritePoi[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isFavoritePoi) : []
  } catch {
    return []
  }
}

export function isFavorite(poiId: string): boolean {
  return readFavorites().some(fav => fav.poi_id === poiId)
}

export function toggleFavorite(entry: FavoritePoi): boolean {
  const current = readFavorites()
  const idx = current.findIndex(fav => fav.poi_id === entry.poi_id)
  const next = idx >= 0
    ? current.filter((_, i) => i !== idx)
    : [{ ...entry, added_at: new Date().toISOString() }, ...current]
  saveFavorites(next)
  return idx < 0
}

export function removeFavorite(poiId: string): void {
  const next = readFavorites().filter(fav => fav.poi_id !== poiId)
  saveFavorites(next)
}

function saveFavorites(favorites: FavoritePoi[]): void {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function subscribeToFavorites(callback: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => callback()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

function isFavoritePoi(value: unknown): value is FavoritePoi {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.poi_id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.city_slug === 'string' &&
    typeof v.category_slug === 'string' &&
    typeof v.poi_slug === 'string' &&
    (v.photo === null || typeof v.photo === 'string') &&
    typeof v.added_at === 'string'
  )
}
