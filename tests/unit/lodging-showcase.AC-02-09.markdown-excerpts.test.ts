import { shortDescriptionText } from '@/features/lodging-showcase/lib/short-description'
import { lodgingDetailMetadata } from '@/features/seo/lib/metadata'

describe('AC-02-09 — extraits lisibles du Markdown', () => {
  it('keeps text from formatting, lists and links', () => {
    expect(shortDescriptionText('## **Chalet**\n\n- *Vue montagne*\n- [Découvrir](https://example.com)'))
      .toBe('Chalet Vue montagne Découvrir')
  })
  it('does not leave raw HTML in excerpts', () => {
    expect(shortDescriptionText('<b>Chalet</b>')).toBe('Chalet')
  })
  it('uses plain text for SEO metadata', () => {
    const metadata = lodgingDetailMetadata({ title: 'Chalet', shortDescription: '**Chalet** avec *terrasse*', lodgingSlug: 'chalet', coverPhoto: null })
    expect(metadata.description).toBe('Chalet avec terrasse')
  })
})
