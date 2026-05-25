export interface GeminiRawPoi {
  name: string
  address: string
  phone: string | null
  website: string | null
  description: string
  subcategory: string | null
  hours: Record<string, string | null> | null
  tags: string[]
}

export interface GeminiFetchResult {
  status: 'fetched' | 'cached' | 'error'
  poi_count: number
  expires_at?: string  // ISO string; absent when status='error' or no cache row
  error?: string | null
}

export type CacheStatus = 'valid' | 'expired' | 'absent' | 'fetching'

export interface CacheInfo {
  status: CacheStatus
  cacheId: string | null
  expiresAt: Date | null
}

export interface FetchParams {
  cityId: string
  categoryId: string
  forceRefresh?: boolean
}
