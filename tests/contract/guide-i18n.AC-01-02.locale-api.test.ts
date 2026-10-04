import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/guide/locale/route'

function put(body: unknown) {
  return PUT(new NextRequest('http://localhost:3000/api/guide/locale', {
    method: 'PUT',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }))
}

describe('PUT /api/guide/locale — spec 061 AC-01-02', () => {
  it.each(['fr', 'en'])('204 et cookie staylocal_locale=%s (180 jours)', async locale => {
    const res = await put({ locale })
    expect(res.status).toBe(204)
    const cookie = res.cookies.get('staylocal_locale')
    expect(cookie?.value).toBe(locale)
    expect(cookie?.maxAge).toBe(180 * 24 * 60 * 60)
    expect(cookie?.sameSite).toBe('lax')
    expect(cookie?.path).toBe('/')
  })

  it.each([{ locale: 'it' }, {}, 'pas du json'])('400 INVALID_LOCALE pour %p', async body => {
    const res = await put(body)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: { code: 'INVALID_LOCALE', message: expect.any(String), details: expect.any(Object) } })
    expect(res.cookies.get('staylocal_locale')).toBeUndefined()
  })
})
