import ServicesPrivesPage from '@/app/(public)/services-prives/page'

const mockRedirect = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

describe('legacy recommendations route', () => {
  beforeEach(() => {
    mockRedirect.mockReset()
  })

  it('redirects /services-prives to /nos-recommandations', async () => {
    await ServicesPrivesPage()

    expect(mockRedirect).toHaveBeenCalledWith('/nos-recommandations')
  })
})
