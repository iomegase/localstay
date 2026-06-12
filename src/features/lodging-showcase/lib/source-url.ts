import type { ExternalListingDetection } from '../types'

function hostname(value: string): string {
  return new URL(value).hostname.replace(/^www\./, '').toLowerCase()
}

export function detectExternalListingSource(value: string): ExternalListingDetection {
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error('EXTERNAL_URL_HTTPS_REQUIRED')

  const host = hostname(value)
  if (host.endsWith('airbnb.fr') || host.endsWith('airbnb.com')) {
    const roomMatch = url.pathname.match(/\/rooms\/(\d+)/)
    return { platform: 'airbnb', identifier: roomMatch?.[1] ?? null, metadataStatus: 'url_only' }
  }

  if (host.endsWith('booking.com')) {
    return { platform: 'booking', identifier: null, metadataStatus: 'url_only' }
  }

  throw new Error('EXTERNAL_PLATFORM_NOT_ALLOWED')
}
