import { movePhoto } from '@/features/guide-customization/lib/validation'

// Spec 099 AC-01-02 (PO 2026-10-18) — réordonnancement des photos d'une carte.
describe('099 AC-01-02 — movePhoto', () => {
  const photos = ['/a.jpg', '/b.jpg', '/c.jpg']

  it('déplace une photo vers l’avant', () => {
    expect(movePhoto(photos, '/c.jpg', '/a.jpg')).toEqual(['/c.jpg', '/a.jpg', '/b.jpg'])
  })

  it('déplace une photo vers l’arrière', () => {
    expect(movePhoto(photos, '/a.jpg', '/c.jpg')).toEqual(['/b.jpg', '/c.jpg', '/a.jpg'])
  })

  it('ne change rien pour un identifiant inconnu ou identique', () => {
    expect(movePhoto(photos, '/x.jpg', '/a.jpg')).toBe(photos)
    expect(movePhoto(photos, '/b.jpg', '/b.jpg')).toBe(photos)
  })
})
