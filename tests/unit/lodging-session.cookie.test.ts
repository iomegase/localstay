/** @jest-environment node */

import { DELETE } from '@/app/api/public/lodging-session/route'

describe('lodging bearer cookie clearing', () => {
  it('expires the cookie with the same server-only scope used at activation', async () => {
    const response = await DELETE()
    const setCookie = response.headers.get('set-cookie') ?? ''

    expect(setCookie).toContain('lodging_id=')
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Max-Age=0')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=lax')
    expect(setCookie).not.toContain('Secure')
  })
})
