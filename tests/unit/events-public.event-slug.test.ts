import { slugify, buildEventSlug } from '@/features/events-public/lib/event-slug'

describe('slugify', () => {
  it('met en minuscules, retire les accents et remplace les espaces par des tirets', () => {
    expect(slugify('Concert à la Médiathèque')).toBe('concert-a-la-mediatheque')
  })
  it('supprime la ponctuation et fusionne les tirets', () => {
    expect(slugify('Marché  artisanal !! (centre-ville)')).toBe('marche-artisanal-centre-ville')
  })
  it('rogne les tirets en début/fin', () => {
    expect(slugify('  --Trail--  ')).toBe('trail')
  })
  it('renvoie "evenement" pour une chaîne sans caractère alphanumérique', () => {
    expect(slugify('!!!')).toBe('evenement')
  })
})

describe('buildEventSlug', () => {
  it('combine le titre slugifié et un suffixe court dérivé du sourceId', () => {
    const slug = buildEventSlug('Concert au théâtre', 'https://data.datatourisme.fr/abc/DEF12345')
    expect(slug).toMatch(/^concert-au-theatre-[a-z0-9]{6}$/)
  })
  it('est déterministe pour un même (titre, sourceId)', () => {
    const a = buildEventSlug('Festival', 'src-123')
    const b = buildEventSlug('Festival', 'src-123')
    expect(a).toBe(b)
  })
  it('produit des suffixes différents pour le même titre mais des sourceId différents', () => {
    const a = buildEventSlug('Festival', 'src-123')
    const b = buildEventSlug('Festival', 'src-999')
    expect(a).not.toBe(b)
  })
})
