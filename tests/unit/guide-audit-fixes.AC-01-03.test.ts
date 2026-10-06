import { guideCoverImage } from '@/features/guide-app/lib/cover-image'
import { recyclingMapsHref } from '@/features/guide-app/lib/recycling-maps'

// Spec 084 — corrections de l'audit du guide.
describe('084 AC-01 — photo de couverture du guide', () => {
  const showcase = [
    { url: 'https://cdn.test/a.webp', is_cover: false },
    { url: 'https://cdn.test/cover.webp', is_cover: true },
  ]

  it('photo du Guide en priorité (BR-01)', () => {
    expect(guideCoverImage(' https://cdn.test/guide.webp ', showcase)).toBe('https://cdn.test/guide.webp')
  })

  it('sinon couverture de la page Logement, sinon sa première photo', () => {
    expect(guideCoverImage(null, showcase)).toBe('https://cdn.test/cover.webp')
    expect(guideCoverImage('', [{ url: 'https://cdn.test/a.webp', is_cover: false }])).toBe('https://cdn.test/a.webp')
  })

  it('aucune photo → null (image générique)', () => {
    expect(guideCoverImage(null, [])).toBeNull()
  })
})

describe('084 AC-03 — recherche du point de tri', () => {
  it('n’ajoute pas la ville si l’adresse contient un code postal ou la ville', () => {
    expect(recyclingMapsHref('119 chemin des prés, 74170 Saint Gervais les Bains', 'Saint-Gervais-les-Bains'))
      .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('119 chemin des prés, 74170 Saint Gervais les Bains')}`)
    expect(recyclingMapsHref('Parking du Bettex, Saint-Gervais-les-Bains', 'Saint-Gervais-les-Bains'))
      .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Parking du Bettex, Saint-Gervais-les-Bains')}`)
  })

  it('ajoute la ville à une simple indication ; garde un lien Maps tel quel', () => {
    expect(recyclingMapsHref('Parking du Bettex', 'Saint-Gervais-les-Bains'))
      .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Parking du Bettex Saint-Gervais-les-Bains')}`)
    expect(recyclingMapsHref('https://maps.app.goo.gl/abc', 'X')).toBe('https://maps.app.goo.gl/abc')
  })
})
