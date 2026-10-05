import { lookup as dnsLookup } from 'node:dns/promises'
import { request as httpsRequest } from 'node:https'
import { isIP } from 'node:net'
import { Readable } from 'node:stream'

export const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3
// Formats matriciels attendus d'un site d'établissement (pas de SVG, rendu par librsvg).
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])

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

type ResolvedAddress = { address: string; family: number }
type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address?: string | ResolvedAddress[],
  family?: number,
) => void

function isPrivateIpv4(parts: readonly number[]): boolean {
  const [a, b, c] = parts
  return a === 0 || a === 10 || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && (c === 0 || c === 2))
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
}

/** Développe une adresse IPv6 (y compris avec queue IPv4 pointée) en 16 octets. */
function ipv6Bytes(ip: string): number[] | null {
  let text = ip
  const dotted = text.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
  if (dotted) {
    const v4 = dotted[2].split('.').map(Number)
    text = `${dotted[1]}${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 0) return null
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  const bytes: number[] = []
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null
    const value = Number.parseInt(group, 16)
    bytes.push(value >> 8, value & 0xff)
  }
  return bytes
}

function isPrivateIpv6(ip: string): boolean {
  const bytes = ipv6Bytes(ip)
  if (!bytes) return true
  const zero = (from: number, to: number) => bytes.slice(from, to).every(byte => byte === 0)
  const v4 = (offset: number) => bytes.slice(offset, offset + 4)
  // ::ffff:a.b.c.d (IPv4 mappée) et ::a.b.c.d (IPv4 compatible, dont :: et ::1).
  if (zero(0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) return isPrivateIpv4(v4(12))
  if (zero(0, 12)) return true
  // NAT64 64:ff9b::/96 et 6to4 2002::/16 : classées par leur adresse IPv4.
  if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b && zero(4, 12)) return isPrivateIpv4(v4(12))
  if (bytes[0] === 0x20 && bytes[1] === 0x02) return isPrivateIpv4(v4(2))
  if ((bytes[0] & 0xfe) === 0xfc) return true // fc00::/7
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true // fe80::/10
  if (bytes[0] === 0xff) return true // ff00::/8
  if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d && bytes[3] === 0xb8) return true // 2001:db8::/32
  return false
}

function isPrivateAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, '').toLowerCase()
  const version = isIP(ip)
  if (version === 4) return isPrivateIpv4(ip.split('.').map(Number))
  if (version === 6) return isPrivateIpv6(ip)
  return true
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

/**
 * Résolution utilisée par la connexion elle-même : une adresse privée renvoyée par
 * une seconde résolution (rebond DNS) fait échouer la connexion.
 */
export function createPinnedLookup(resolve: (host: string) => Promise<ResolvedAddress[]>) {
  return (hostname: string, options: { all?: boolean }, callback: LookupCallback): void => {
    resolve(hostname)
      .then(addresses => {
        if (addresses.length === 0 || addresses.some(entry => isPrivateAddress(entry.address))) {
          const error: NodeJS.ErrnoException = new Error(`Hôte refusé : ${hostname}`)
          error.code = 'PRIVATE_HOST'
          callback(error)
          return
        }
        // Node 20+ (autoSelectFamily) demande toutes les adresses.
        if (options.all) callback(null, addresses)
        else callback(null, addresses[0].address, addresses[0].family)
      })
      .catch((error: NodeJS.ErrnoException) => callback(error))
  }
}

const pinnedLookup = createPinnedLookup(host => dnsLookup(host, { all: true }))

/** fetch minimal sur https natif, connexion épinglée sur une adresse publique. */
const pinnedFetch = ((input: URL | string, init?: RequestInit): Promise<Response> =>
  new Promise((resolvePromise, reject) => {
    const url = new URL(String(input))
    const request = httpsRequest(url, {
      method: 'GET',
      headers: { accept: 'image/*', 'user-agent': 'MyStay-PhotoMirror/1.0' },
      lookup: pinnedLookup as never,
      signal: init?.signal ?? undefined,
    }, response => {
      const headers = new Headers()
      for (const [name, value] of Object.entries(response.headers)) {
        if (typeof value === 'string') headers.set(name, value)
        else if (Array.isArray(value)) headers.set(name, value.join(', '))
      }
      const status = response.statusCode ?? 500
      const hasBody = status !== 204 && status !== 304 && !(status >= 300 && status < 400)
      if (!hasBody) response.resume()
      const body = hasBody ? (Readable.toWeb(response) as unknown as ReadableStream<Uint8Array>) : null
      resolvePromise(new Response(body, { status, headers }))
    })
    request.on('error', reject)
    request.end()
  })) as typeof fetch

const defaultDeps: DownloadDeps = {
  fetch: pinnedFetch,
  lookup: async host => (await dnsLookup(host, { all: true })).map(entry => entry.address),
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

async function discard(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // Corps déjà consommé ou fermé : rien à libérer.
  }
}

/**
 * Spec 063 US-02 — télécharge une image tierce en refusant les cibles internes
 * (à chaque redirection et à la connexion), les formats non matriciels, > 8 Mo ou > 10 s.
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
        await discard(response)
        if (!location) return { ok: false, reason: 'HTTP_ERROR' }
        current = new URL(location, current)
        continue
      }
      if (!response.ok) {
        await discard(response)
        return { ok: false, reason: 'HTTP_ERROR' }
      }

      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
        await discard(response)
        return { ok: false, reason: 'NOT_IMAGE' }
      }
      const declared = Number(response.headers.get('content-length') ?? '0')
      if (declared > MAX_DOWNLOAD_BYTES) {
        await discard(response)
        return { ok: false, reason: 'TOO_LARGE' }
      }

      const body = await readCapped(response)
      if (!body) return { ok: false, reason: 'TOO_LARGE' }
      return { ok: true, body, contentType }
    }
    return { ok: false, reason: 'TOO_MANY_REDIRECTS' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return { ok: false, reason: 'TIMEOUT' }
    if ((error as NodeJS.ErrnoException)?.code === 'PRIVATE_HOST') return { ok: false, reason: 'PRIVATE_HOST' }
    return { ok: false, reason: 'NETWORK' }
  } finally {
    clearTimeout(timer)
  }
}
