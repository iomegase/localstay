import { NextRequest } from 'next/server'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(() => ({
    auth: { getUser: jest.fn(async () => ({ data: { user: null } })) },
  })),
}))

import { proxy } from '../../src/proxy'

// Spec 064 — nettoyage des anciennes URL /guide (410 Gone).
const LODGING_ID = '11111111-1111-4111-8111-111111111111'

function anonRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`)
}

function guestRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: `lodging_id=${LODGING_ID}` },
  })
}

describe('064 AC-01-01 — toute URL /guide hors séjour répond 410', () => {
  it.each([
    '/guide/saint-gervais-les-bains',
    '/guide/saint-gervais-les-bains/location-de-ski',
    '/guide/saint-gervais-les-bains/location-de-ski/blanc-sport',
    '/guide/saint-gervais-les-bains/rando/mont-joux/start',
    '/guide/chamonix-mont-blanc/agenda',
    '/guide/chamonix-mont-blanc/agenda/concert-cosmojazz-978429',
    '/guide/saint-gervais-les-bains/logements',
    '/guide/saint-gervais-les-bains/logements/le-chalet-hygge',
    '/guide/saint-nicolas-de-veroce/mes-favoris',
    '/guide/saint-gervais-les-bains/contact',
  ])('%s → 410 sans redirection ni réécriture', async path => {
    const res = await proxy(anonRequest(path))
    expect(res.status).toBe(410)
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    expect(res.headers.get('x-middleware-next')).toBeNull()
  })
})

describe('064 AC-01-02 — contenu de la réponse 410', () => {
  it('porte noindex, no-store et un corps HTML français', async () => {
    const res = await proxy(anonRequest('/guide/chamonix-mont-blanc/agenda'))
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')

    const body = await res.text()
    expect(body).toContain('<html lang="fr">')
    expect(body).toContain('Cette page n’existe plus')
    expect(body).toContain('href="/"')
    expect(body).toContain('QR code de votre logement')
  })
})

describe('064 AC-01-03 / AC-01-04 — guide privé inchangé', () => {
  it('une entrée QR valide redirige toujours vers /sejour', async () => {
    const res = await proxy(anonRequest(`/guide/saint-gervais-les-bains?lodging=${LODGING_ID}`))
    expect(res.status).not.toBe(410)
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe('/sejour')
  })

  it('un séjour actif garde l’accès à l’agenda', async () => {
    const res = await proxy(guestRequest('/guide/saint-gervais-les-bains/agenda'))
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('un séjour actif reste confiné vers /sejour sur la page ville', async () => {
    const res = await proxy(guestRequest('/guide/saint-gervais-les-bains'))
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe('/sejour')
  })
})

describe('064 AC-01-05 — identifiant ?lodging= invalide', () => {
  it('répond 410 sans poser de cookie', async () => {
    const res = await proxy(anonRequest('/guide/saint-gervais-les-bains/contact?lodging=not-a-uuid'))
    expect(res.status).toBe(410)
    expect(res.cookies.get('lodging_id')).toBeUndefined()
  })
})

describe('064 BR-05 — routes privées hors /guide inchangées', () => {
  it('garde l’écran « Accès par lien » sur /mes-favoris', async () => {
    const res = await proxy(anonRequest('/mes-favoris'))
    expect(res.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/acces-reserve')
  })
})
