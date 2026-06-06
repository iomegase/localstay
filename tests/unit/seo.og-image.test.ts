import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/features/seo/lib/og-image'
import { SITE } from '@/features/seo/lib/site'

describe('ogCard', () => {
  it('uses the provided title and the site name as eyebrow', () => {
    const card = ogCard({ title: 'Annecy' })
    expect(card.eyebrow).toBe(SITE.name)
    expect(card.title).toBe('Annecy')
  })

  it('falls back to the site name when no title is given', () => {
    expect(ogCard({}).title).toBe(SITE.name)
    expect(ogCard({ title: '   ' }).title).toBe(SITE.name)
  })

  it('uses the default site description as subtitle when none is provided', () => {
    expect(ogCard({ title: 'Annecy' }).subtitle).toBe(SITE.defaultDescription)
  })

  it('uses a provided subtitle', () => {
    expect(ogCard({ title: 'Annecy', subtitle: 'Le guide local' }).subtitle).toBe('Le guide local')
  })

  it('truncates an overly long title with an ellipsis', () => {
    const long = 'A'.repeat(120)
    const { title } = ogCard({ title: long })
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title.endsWith('…')).toBe(true)
  })

  it('truncates an overly long subtitle with an ellipsis', () => {
    const long = 'B'.repeat(300)
    const { subtitle } = ogCard({ title: 'X', subtitle: long })
    expect(subtitle.length).toBeLessThanOrEqual(160)
    expect(subtitle.endsWith('…')).toBe(true)
  })
})

describe('OG image constants', () => {
  it('declares the standard 1200x630 PNG used by social crawlers', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
    expect(OG_CONTENT_TYPE).toBe('image/png')
  })
})
