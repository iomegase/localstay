import { markdownToPlainText } from '@/shared/lib/markdown-plain-text'
import { truncate } from '@/features/seo/lib/metadata'

// PO 2026-10-08 : descriptions en Markdown → texte brut pour Google (meta description, JSON-LD).
describe('markdownToPlainText', () => {
  it('retire gras, intertitres, puces, liens et citations', () => {
    const markdown = [
      '## Une brasserie au cœur de Saint-Gervais',
      '',
      'La **Brasserie du Mont Blanc** accueille *habitants* et visiteurs.',
      '',
      '- **Cuisine :** savoyarde',
      '- Terrasse',
      '',
      '> Réservation conseillée',
      '',
      'Voir [le site](https://brasserie.example).',
    ].join('\n')
    expect(markdownToPlainText(markdown)).toBe(
      'Une brasserie au cœur de Saint-Gervais. La Brasserie du Mont Blanc accueille habitants et visiteurs. Cuisine : savoyarde Terrasse Réservation conseillée Voir le site.',
    )
  })

  it('texte sans Markdown inchangé (espaces normalisés)', () => {
    expect(markdownToPlainText('Une adresse   simple.\n\nDeux paragraphes.')).toBe('Une adresse simple. Deux paragraphes.')
  })

  it('meta description : aucune trace de Markdown après troncature', () => {
    const meta = truncate(markdownToPlainText(`## Titre\n\n**Gras** ${'mot '.repeat(80)}`))
    expect(meta).not.toMatch(/[*#]/)
    expect(meta.startsWith('Titre. Gras mot')).toBe(true)
  })
})
