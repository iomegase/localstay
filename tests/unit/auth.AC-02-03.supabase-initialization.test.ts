jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ getAll: () => [], set: jest.fn() })),
}))

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function loadSupabaseHelpers() {
  return jest.requireActual<typeof import('@/shared/lib/supabase')>('@/shared/lib/supabase')
}

function restoreVariable(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

afterEach(() => {
  restoreVariable('NEXT_PUBLIC_SUPABASE_URL', originalUrl)
  restoreVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY', originalKey)
  jest.resetModules()
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
