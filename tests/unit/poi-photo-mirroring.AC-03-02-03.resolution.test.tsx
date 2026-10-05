/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
const mockFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { poiPhotoMirror: { findMany: (...a: unknown[]) => mockFindMany(...a) } } }))

import { getPoiPhotoMirrorMap, resolvePoiPhotoList, resolvePoiPhotoUrl } from '@/features/poi-photos/queries/photo-mirror-map'
import { RemotePoiImage } from '@/features/public-discovery/components/RemotePoiImage'

const SUPABASE = 'https://abcdefgh.supabase.co'
const COPY = `${SUPABASE}/storage/v1/object/public/guide-photos/pois/p/abc.webp`
beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE })

describe('063 — résolution des URL', () => {
  it('AC-03-01 / AC-03-02: remplace par la copie quand elle existe, sinon garde l’original', async () => {
    mockFindMany.mockResolvedValue([{ source_url: 'https://site.fr/a.jpg', storage_url: COPY }])
    const map = await getPoiPhotoMirrorMap()
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deleted_at: null } }))
    expect(resolvePoiPhotoUrl('https://site.fr/a.jpg', map)).toBe(COPY)
    expect(resolvePoiPhotoUrl('https://site.fr/b.jpg', map)).toBe('https://site.fr/b.jpg')
    expect(resolvePoiPhotoList(['https://site.fr/a.jpg', '/fallback/x.webp'], map)).toEqual([COPY, '/fallback/x.webp'])
  })

  it('BR-04: une erreur de lecture renvoie une table vide', async () => {
    mockFindMany.mockRejectedValue(new Error('db down'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const map = await getPoiPhotoMirrorMap()
    expect(map.size).toBe(0)
  })
})

describe('063 AC-03-03 — RemotePoiImage', () => {
  it('passe par l’optimiseur next/image pour une copie MyStay', () => {
    render(<RemotePoiImage src={COPY} alt="Le Royal" width={1200} height={900} loading="eager" fetchPriority="high" />)
    const img = screen.getByRole('img', { name: 'Le Royal' })
    expect(img.getAttribute('src')).toContain(`/_next/image?url=${encodeURIComponent(COPY)}`)
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('garde le <img> direct pour une URL tierce', () => {
    render(<RemotePoiImage src="https://site.fr/a.jpg" alt="Tiers" width={600} height={400} loading="lazy" />)
    expect(screen.getByRole('img', { name: 'Tiers' })).toHaveAttribute('src', 'https://site.fr/a.jpg')
  })

  it('retombe sur l’image de secours quand une copie est introuvable', () => {
    render(<RemotePoiImage src={COPY} alt="Cassée" width={600} height={400} loading="lazy" />)
    fireEvent.error(screen.getByRole('img', { name: 'Cassée' }))
    expect(screen.getByRole('img', { name: 'Cassée' }).getAttribute('src')).toContain('og-mystay.png')
  })
})
