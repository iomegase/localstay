import { assignVariants, type RecRow } from '@/app/(public)/nos-recommandations/_components/variants'

function row(id: string, opts: { photo?: boolean; note?: boolean } = {}): RecRow {
  return {
    poi_id: id,
    owner_note: opts.note ? 'Une note' : null,
    poi: {
      id,
      name: `POI ${id}`,
      slug: id,
      description: null,
      photos: opts.photo ? ['https://cdn.test/p.jpg'] : [],
      category: { name: 'Restaurants', slug: 'restaurants' },
      city: { slug: 'saint-gervais', name: 'Saint-Gervais' },
    },
  }
}

describe('assignVariants', () => {
  it('returns bigImage for a single photo POI', () => {
    expect(assignVariants([row('a', { photo: true })]).map(c => c.variant)).toEqual(['bigImage'])
  })

  it('returns white for a single photoless POI (notes no longer affect variants)', () => {
    expect(assignVariants([row('a', { note: true })]).map(c => c.variant)).toEqual(['white'])
    expect(assignVariants([row('a')]).map(c => c.variant)).toEqual(['white'])
  })

  it('cycles bigImage,image,white,sand for four photo POIs', () => {
    const rows = ['a', 'b', 'c', 'd'].map(id => row(id, { photo: true }))
    expect(assignVariants(rows).map(c => c.variant)).toEqual(['bigImage', 'image', 'white', 'sand'])
  })

  it('replaces an image slot with white when the POI has no photo', () => {
    const rows = [row('a', { photo: true }), row('b', { note: true })]
    expect(assignVariants(rows).map(c => c.variant)).toEqual(['bigImage', 'white'])
  })
})
