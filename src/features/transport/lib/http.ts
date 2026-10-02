import { NextResponse } from 'next/server'
import type { TransportEnvelope } from '../types'

/** Réponse transport ; seules les réponses exploitables sont partagées en CDN. */
export function transportJson<T>(envelope: TransportEnvelope<T>, sharedMaxAgeSeconds: number): NextResponse {
  const cacheable = envelope.status !== 'unavailable' && envelope.status !== 'stale'
  return NextResponse.json(envelope, {
    headers: {
      'Cache-Control': cacheable ? `public, s-maxage=${sharedMaxAgeSeconds}` : 'no-store',
    },
  })
}
