import { camptocampDescription, limitAtBoundary } from '@/features/trails-acquisition/services/camptocamp'

// Spec 019 AC-COR-01 — texte Camptocamp complet, coupé seulement à une frontière.
describe('019 AC-COR-01 — description Camptocamp', () => {
  it('garde un texte de 2 129 caractères entier (plus de coupure à 1 500)', () => {
    const paragraph = 'Du Col de la Seigne, suivre le chemin plein S. '.repeat(45)
    const html = `<p>${paragraph}</p><p>## Descente à la Visaille</p><p>Du sommet, descendre vers le lac.</p>`
    const text = camptocampDescription(html)!
    expect(text.length).toBeGreaterThan(1500)
    expect(text.endsWith('Du sommet, descendre vers le lac.')).toBe(true)
  })

  it('au-delà de la limite, coupe à la fin d’un paragraphe, sinon d’une phrase, jamais au milieu d’un mot', () => {
    // Une frontière n'est retenue qu'au-delà de 60 % de la limite (on ne jette pas la moitié du texte).
    expect(limitAtBoundary('Premier paragraphe assez long pour compter.\n\nSecond paragraphe beaucoup trop long', 60)).toBe('Premier paragraphe assez long pour compter.')
    expect(limitAtBoundary('Une phrase entière qui compte vraiment ici. Une autre phrase qui déborde', 60)).toBe('Une phrase entière qui compte vraiment ici.')
    expect(limitAtBoundary('motlong '.repeat(10), 21)).toBe('motlong motlong')
    expect(limitAtBoundary('court', 50)).toBe('court')
  })
})
