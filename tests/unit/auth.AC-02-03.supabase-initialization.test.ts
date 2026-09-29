jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ getAll: () => [], set: jest.fn() })),
}))

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const originalPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

function loadSupabaseHelpers() {
  return jest.requireActual<typeof import('@/shared/lib/supabase')>('@/shared/lib/supabase')
}

function restoreVariable(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
})

afterEach(() => {
  restoreVariable('NEXT_PUBLIC_SUPABASE_URL', originalUrl)
  restoreVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY', originalKey)
  restoreVariable('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', originalPublishableKey)
  jest.restoreAllMocks()
  jest.resetModules()
})

it.each(['route', 'page', 'middleware'] as const)('AC-04-01: the %s client uses the publishable key instead of a stale anon key', async (kind) => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'stale-public-key'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ' sb_publishable_test_current_key '
  jest.resetModules()
  const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  const helpers = loadSupabaseHelpers()
  const client = kind === 'route' ? await helpers.createSupabaseRouteClient()
    : kind === 'page' ? await helpers.createSupabasePageClient()
      : helpers.createSupabaseMiddlewareClient(new NextRequest('https://example.com'), NextResponse.next())

  const { error } = await client.auth.resetPasswordForEmail('owner@example.com')
  expect(error).toBeNull()
  expect(fetchSpy).toHaveBeenCalledTimes(1)
  const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers)
  expect(headers.get('apikey')).toBe('sb_publishable_test_current_key')
})

it('AC-04-01: a blank publishable variable retains compatibility with the legacy anon key', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ' legacy-public-key '
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ' '
  jest.resetModules()
  const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  const client = await loadSupabaseHelpers().createSupabaseRouteClient()
  await client.auth.resetPasswordForEmail('owner@example.com')
  const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers)
  expect(headers.get('apikey')).toBe('legacy-public-key')
})

it('AC-04-01: diagnostics describe the selected publishable key without exposing either credential', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'stale-public-key'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_current_key'
  const { getSupabaseConfigurationDiagnostics } = jest.requireActual<typeof import('@/features/auth/lib/supabase-diagnostics')>('@/features/auth/lib/supabase-diagnostics')
  const diagnostics = getSupabaseConfigurationDiagnostics()
  expect(diagnostics).toMatchObject({ keyKind: 'publishable', keySource: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' })
  expect(JSON.stringify(diagnostics)).not.toContain(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  expect(JSON.stringify(diagnostics)).not.toContain(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
})

it('AC-02-03: importing server helpers does not create a client during build without Supabase credentials', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  jest.resetModules()
  expect(() => loadSupabaseHelpers()).not.toThrow()
})

it('AC-02-03: a request without Supabase credentials fails closed', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  jest.resetModules()
  let createClient: () => Promise<unknown> = async () => {}
  jest.isolateModules(() => {
    createClient = loadSupabaseHelpers().createSupabaseRouteClient
  })
  await expect(createClient()).rejects.toThrow(/URL and (API key|Key)/i)
})

it('AC-02-03: a configured request creates its server client on demand', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key'
  jest.resetModules()
  const client = await loadSupabaseHelpers().createSupabaseRouteClient()
  expect(client.auth.getUser).toEqual(expect.any(Function))
})
import { NextRequest, NextResponse } from 'next/server'
