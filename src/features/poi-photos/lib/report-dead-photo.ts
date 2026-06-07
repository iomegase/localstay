'use client'

/** Signale une photo morte au serveur (fire-and-forget ; les erreurs sont ignorées). */
export function reportDeadPhoto(poiId: string, url: string): void {
  try {
    void fetch(`/api/pois/${poiId}/report-dead-photo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}
