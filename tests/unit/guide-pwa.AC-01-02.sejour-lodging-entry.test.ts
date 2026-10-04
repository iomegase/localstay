import { NextRequest } from 'next/server'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(),
}))

import { proxy } from '../../src/proxy'

const LODGING_ID = '11111111-1111-4111-8111-111111111111'
const OTHER_ID = '22222222-2222-4222-8222-222222222222'

describe('guide-pwa AC-01-02 — ouverture /sejour?lodging= (start_url de l’app installée)', () => {
  it('pose le cookie logement et redirige vers la même URL quand il manque', async () => {
    const res = await proxy(new NextRequest(`http://localhost:3000/sejour?lodging=${LODGING_ID}&source=pwa`))
    const location = new URL(res.headers.get('location') ?? '')
    expect(location.pathname).toBe('/sejour')
    expect(location.searchParams.get('lodging')).toBe(LODGING_ID)
    expect(location.searchParams.get('source')).toBe('pwa')
    expect(res.cookies.get('lodging_id')?.value).toBe(LODGING_ID)
  })

  it('remplace un cookie d’un autre logement', async () => {
    const res = await proxy(new NextRequest(`http://localhost:3000/sejour?lodging=${LODGING_ID}`, {
      headers: { cookie: `lodging_id=${OTHER_ID}` },
    }))
    expect(res.headers.get('location')).not.toBeNull()
    expect(res.cookies.get('lodging_id')?.value).toBe(LODGING_ID)
  })

  it('laisse passer quand le cookie correspond déjà (pas de boucle)', async () => {
    const res = await proxy(new NextRequest(`http://localhost:3000/sejour?lodging=${LODGING_ID}&source=pwa`, {
      headers: { cookie: `lodging_id=${LODGING_ID}` },
    }))
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('ignore un identifiant invalide (écran d’accès)', async () => {
    const res = await proxy(new NextRequest('http://localhost:3000/sejour?lodging=pas-un-uuid'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('x-middleware-rewrite')).toContain('/acces-reserve')
  })

  it('BR-03: marque les pages /sejour servies avec le logement du séjour (cache du SW)', async () => {
    const res = await proxy(new NextRequest('http://localhost:3000/sejour/logement/arrivee', {
      headers: { cookie: `lodging_id=${LODGING_ID}` },
    }))
    expect(res.headers.get('x-mystay-guide-lodging')).toBe(LODGING_ID)
  })

  it('BR-03: aucune marque sur l’écran d’accès réécrit', async () => {
    const res = await proxy(new NextRequest('http://localhost:3000/sejour'))
    expect(res.headers.get('x-middleware-rewrite')).toContain('/acces-reserve')
    expect(res.headers.get('x-mystay-guide-lodging')).toBeNull()
  })
})
