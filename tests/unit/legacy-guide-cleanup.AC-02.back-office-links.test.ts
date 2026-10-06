import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Spec 064 AC-02 — les liens « page publique » du back-office ne visent plus /guide.
function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('064 AC-02 — liens back-office vers /decouvrir', () => {
  it('AC-02-01 : Admin › Villes « Voir le guide » ouvre /decouvrir/{ville}', () => {
    const page = source('src/app/admin/cities/page.tsx')
    expect(page).toContain('href={`/decouvrir/${city.slug}`}')
    expect(page).not.toContain('href={`/guide/${city.slug}`}')
  })

  it('AC-02-02 / 079 : la page Logement ne pointe plus vers l’ancien guide (lien vers la fiche publique)', () => {
    const page = source('src/app/(dashboard)/dashboard/lodgings/[id]/showcase/page.tsx')
    expect(page).toContain('publicLodgingPath(data.profile.slug)')
    expect(page).not.toContain('/guide/')
  })
})
