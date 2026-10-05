import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3

export type DownloadFailure =
  | 'NOT_HTTPS' | 'PRIVATE_HOST' | 'TOO_MANY_REDIRECTS' | 'HTTP_ERROR'
  | 'NOT_IMAGE' | 'TOO_LARGE' | 'TIMEOUT' | 'NETWORK'
export type DownloadResult =
  | { ok: true; body: Buffer; contentType: string }
  | { ok: false; reason: DownloadFailure }
export type DownloadDeps = {
  fetch: typeof fetch
  lookup: (host: string) => Promise<string[]>
}

const defaultDeps: DownloadDeps = {
  fetch: (...args) => fetch(...args),
  lookup: async host => (await dnsLookup(host, { all: true })).map(entry => entry.address),
}

function isPrivateAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, '').toLowerCase()
  if (isIP(ip) === 6) {
    if (ip === '::1' || ip === '::') return true
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateAddress(mapped[1]) : false
  }
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) return true
  const [a, b] = parts
  return a === 0 || a === 10 || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || a >= 224
}

async function isAllowedHost(hostname: string, deps: DownloadDeps): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  if (isIP(host)) return !isPrivateAddress(host)
  try {
    const addresses = await deps.lookup(host)
    return addresses.length > 0 && addresses.every(address => !isPrivateAddress(address))
  } catch {
    return false
  }
}

async function readCapped(response: Response): Promise<Buffer | null> {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_DOWNLOAD_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

/**
 * Spec 063 US-02 — télécharge une image tierce en refusant les cibles internes
 * (à chaque redirection), les contenus non image, > 8 Mo ou > 10 s.
 */
export async function downloadImageSafely(url: string, deps: DownloadDeps = defaultDeps): Promise<DownloadResult> {
  let current: URL
  try {
    current = new URL(url)
  } catch {
    return { ok: false, reason: 'NOT_HTTPS' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      if (current.protocol !== 'https:') return { ok: false, reason: 'NOT_HTTPS' }
      if (!(await isAllowedHost(current.hostname, deps))) return { ok: false, reason: 'PRIVATE_HOST' }

      const response = await deps.fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { accept: 'image/*' },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) return { ok: false, reason: 'HTTP_ERROR' }
        current = new URL(location, current)
        continue
      }
      if (!response.ok) return { ok: false, reason: 'HTTP_ERROR' }

      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
      if (!contentType.startsWith('image/')) return { ok: false, reason: 'NOT_IMAGE' }
      const declared = Number(response.headers.get('content-length') ?? '0')
      if (declared > MAX_DOWNLOAD_BYTES) return { ok: false, reason: 'TOO_LARGE' }

      const body = await readCapped(response)
      if (!body) return { ok: false, reason: 'TOO_LARGE' }
      return { ok: true, body, contentType }
    }
    return { ok: false, reason: 'TOO_MANY_REDIRECTS' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return { ok: false, reason: 'TIMEOUT' }
    return { ok: false, reason: 'NETWORK' }
  } finally {
    clearTimeout(timer)
  }
}
