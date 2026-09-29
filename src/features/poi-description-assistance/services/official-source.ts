import { lookup } from 'node:dns/promises'
import type { LookupAddress } from 'node:dns'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { BlockList, isIP } from 'node:net'
import { extractOfficialWebsiteSourceContext } from '@/features/poi-acquisition/services/official-website-source'
import { DescriptionAssistanceError, HttpUrlSchema } from '../lib/contracts'

const MAX_BYTES = 512 * 1024
const TIMEOUT_MS = 6000
const blocked = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.168.0.0', 16], ['192.88.99.0', 24],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blocked.addSubnet(address, prefix, 'ipv4')
const globalV6 = new BlockList()
globalV6.addSubnet('2000::', 3, 'ipv6')
const nat64 = new BlockList()
nat64.addSubnet('64:ff9b::', 96, 'ipv6')
blocked.addSubnet('2001::', 23, 'ipv6')
blocked.addSubnet('2001:db8::', 32, 'ipv6')
blocked.addSubnet('2002::', 16, 'ipv6')
blocked.addSubnet('3fff::', 20, 'ipv6')

export function isPublicSourceAddress(address: string): boolean {
  const version = isIP(address)
  if (version === 4) return !blocked.check(address, 'ipv4')
  if (version === 6) {
    // DNS64 networks legitimately synthesize these addresses. Apply the same
    // IPv4 restrictions to the embedded destination, never allow the whole range.
    if (nat64.check(address, 'ipv6')) {
      const normalized = new URL(`http://[${address}]`).hostname.slice(1, -1)
      const [left, right] = normalized.split('::')
      const start = left.split(':').filter(Boolean)
      const end = right?.split(':').filter(Boolean) ?? []
      const parts = right === undefined ? start : [...start, ...Array(8 - start.length - end.length).fill('0'), ...end]
      const octets = parts.slice(-2).flatMap(part => {
        const value = Number.parseInt(part, 16)
        return [value >> 8, value & 255]
      })
      return isPublicSourceAddress(octets.join('.'))
    }
    return globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6')
  }
  return false
}

function unreadable(): DescriptionAssistanceError {
  return new DescriptionAssistanceError('SOURCE_URL_UNREADABLE')
}

async function resolvePublicAddress(url: URL, signal: AbortSignal) {
  if (!HttpUrlSchema.safeParse(url.href).success || (url.port && !['80', '443'].includes(url.port))) throw unreadable()
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const family = isIP(hostname)
  // Abort DNS waiting as well as the socket; pin the eventual connection below.
  const addresses = family ? [{ address: hostname, family }] : await new Promise<LookupAddress[]>((resolve, reject) => {
    const abort = () => reject(unreadable())
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) { signal.removeEventListener('abort', abort); abort(); return }
    lookup(hostname, { all: true, verbatim: true }).then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
  if (!addresses.length || addresses.some(entry => !isPublicSourceAddress(entry.address))) throw unreadable()
  return addresses.find(entry => entry.family === 4) ?? addresses[0]
}

async function readPage(url: URL, signal: AbortSignal): Promise<{ html?: string; redirect?: string }> {
  const address = await resolvePublicAddress(url, signal)
  return new Promise((resolve, reject) => {
    const request = url.protocol === 'https:' ? httpsRequest : httpRequest
    const req = request(url, {
      signal,
      agent: false,
      family: address.family,
      // Prevent a second DNS resolution (and DNS rebinding) after validation.
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-encoding': 'identity',
        'user-agent': 'MyStayBot/1.0 poi-description-assistance',
      },
    }, response => {
      response.on('error', reject)
      const status = response.statusCode ?? 0
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        resolve({ redirect: response.headers.location })
        response.destroy()
        return
      }
      const contentType = response.headers['content-type'] ?? ''
      if (status < 200 || status >= 300 || !/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)
        || Number(response.headers['content-length'] ?? 0) > MAX_BYTES
        || !['identity', undefined].includes(response.headers['content-encoding'])) {
        reject(unreadable())
        response.destroy()
        return
      }
      let size = 0
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > MAX_BYTES) {
          reject(unreadable())
          response.destroy()
        } else chunks.push(chunk)
      })
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8') }))
    })
    req.on('error', reject)
    req.end()
  })
}

export async function readOfficialDescriptionSource(sourceUrl: string) {
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  try {
    let url = new URL(HttpUrlSchema.parse(sourceUrl))
    for (let redirects = 0; redirects <= 3; redirects++) {
      const page = await readPage(url, signal)
      if (page.redirect) {
        url = new URL(page.redirect, url)
        continue
      }
      const context = extractOfficialWebsiteSourceContext(page.html ?? '', url.href)
      if (!context.text) throw new DescriptionAssistanceError('DESCRIPTION_SOURCES_INSUFFICIENT')
      return context
    }
    throw unreadable()
  } catch (error) {
    if (error instanceof DescriptionAssistanceError) throw error
    throw unreadable()
  }
}
