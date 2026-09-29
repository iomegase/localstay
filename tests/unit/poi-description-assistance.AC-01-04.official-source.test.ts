import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { IncomingMessage, RequestOptions } from 'node:http'

const mockLookup = jest.fn()
const mockRequest = jest.fn()
jest.mock('node:dns/promises', () => ({ lookup: (...args: unknown[]) => mockLookup(...args) }))
jest.mock('node:https', () => ({ request: (...args: unknown[]) => mockRequest(...args) }))
jest.mock('node:http', () => ({ request: (...args: unknown[]) => mockRequest(...args) }))
import { isPublicSourceAddress, readOfficialDescriptionSource } from '@/features/poi-description-assistance/services/official-source'

function page(body: string, statusCode = 200, headers: Record<string, string> = { 'content-type': 'text/html' }) {
  mockRequest.mockImplementationOnce((_url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void) => {
    const request = Object.assign(new EventEmitter(), { end() {
      const response = Object.assign(new PassThrough(), { statusCode, headers })
      callback(response as unknown as IncomingMessage)
      response.end(body)
    } })
    expect(options.agent).toBe(false)
    const pinned = jest.fn()
    options.lookup?.('refuge.example', {}, pinned)
    expect(pinned).toHaveBeenCalledWith(null, '93.184.216.34', 4)
    return request
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
})

it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::ffff:127.0.0.1', 'fe80::1', 'fc00::1', '2001:db8::1', '2002:7f00:1::1', 'invalid'])('blocks nonpublic address %s', address => expect(isPublicSourceAddress(address)).toBe(false))
it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111'])('accepts public address %s', address => expect(isPublicSourceAddress(address)).toBe(true))

it.each(['64:ff9b::7f00:1', '64:ff9b::a9fe:a9fe', '64:ff9b::192.168.1.1', '64:ff9b::'])('blocks NAT64 translation of private address %s', address => expect(isPublicSourceAddress(address)).toBe(false))
it.each(['64:ff9b::d5ba:2113', '64:ff9b::8.8.8.8'])('accepts NAT64 translation of public address %s', address => expect(isPublicSourceAddress(address)).toBe(true))

it('AC-01: supports DNS64 answers and prefers a public IPv4 connection', async () => {
  mockLookup.mockResolvedValue([{ address: '64:ff9b::5db8:d822', family: 6 }, { address: '93.184.216.34', family: 4 }])
  page('<p>Ce refuge accueille les randonneurs.</p>')
  await expect(readOfficialDescriptionSource('https://refuge.example')).resolves.toMatchObject({ attribution: 'refuge.example' })
})

it('AC-01: extracts HTML descriptions with a DNS-pinned connection', async () => {
  page('<title>Refuge</title><meta name="description" content="Un chalet qui accueille les randonneurs.">')
  await expect(readOfficialDescriptionSource('https://refuge.example')).resolves.toMatchObject({ source_url: 'https://refuge.example/', text: expect.stringContaining('Un chalet') })
})

it.each(['http://127.0.0.1', 'http://[::1]', 'file:///etc/passwd', 'http://user:pass@refuge.example', 'http://refuge.example:3000', 'http://2130706433'])('AC-04: rejects unsafe URL %s without connecting', async url => {
  await expect(readOfficialDescriptionSource(url)).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
  expect(mockRequest).not.toHaveBeenCalled()
})

it('AC-04: rejects mixed public and private DNS answers', async () => {
  mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }])
  await expect(readOfficialDescriptionSource('https://refuge.example')).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
  expect(mockRequest).not.toHaveBeenCalled()
})

it('AC-04: validates redirects before making the next connection', async () => {
  page('', 302, { location: 'http://169.254.169.254/metadata' })
  await expect(readOfficialDescriptionSource('https://refuge.example')).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
  expect(mockRequest).toHaveBeenCalledTimes(1)
})

it('AC-01: returns the final source URL after a valid redirect', async () => {
  page('', 301, { location: '/refuge' })
  page('<p>Ce refuge accueille les randonneurs.</p>')
  await expect(readOfficialDescriptionSource('https://refuge.example')).resolves.toMatchObject({ source_url: 'https://refuge.example/refuge' })
})

it.each([
  ['oversized', 'x'.repeat(512 * 1024 + 1), 200, { 'content-type': 'text/html' }],
  ['not HTML', 'image', 200, { 'content-type': 'image/png' }],
  ['unavailable', 'error', 503, { 'content-type': 'text/html' }],
] as const)('AC-04: rejects %s response', async (_name, body, status, headers) => {
  page(body, status, headers)
  await expect(readOfficialDescriptionSource('https://refuge.example')).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
})

it('AC-04: bounds redirect loops', async () => {
  for (let i = 0; i < 4; i++) page('', 302, { location: '/again' })
  await expect(readOfficialDescriptionSource('https://refuge.example')).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
  expect(mockRequest).toHaveBeenCalledTimes(4)
})

it('AC-04: times out even if DNS never completes', async () => {
  const controller = new AbortController()
  const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
  mockLookup.mockReturnValue(new Promise(() => {}))
  const result = readOfficialDescriptionSource('https://refuge.example')
  controller.abort()
  await expect(result).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
  timeout.mockRestore()
})
