const redirect = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: (href: string) => redirect(href),
}))

import LegacyLoginPage from '@/app/(auth)/login/page'

describe('009 auth legacy login route', () => {
  beforeEach(() => redirect.mockClear())

  it('BR-09: redirects /login to the canonical /auth/login route', () => {
    LegacyLoginPage()
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
})
