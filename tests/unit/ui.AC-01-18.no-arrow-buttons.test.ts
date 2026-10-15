import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Spec 031 AC-01-18 : plus de flèche décorative à côté du libellé de ces boutons.
const buttons: [string, string][] = [
  ['src/app/(public)/seminaires/page.tsx', 'Découvrir nos logements'],
  ['src/features/public-discovery/components/DiscoveryIndexView.tsx', 'Découvrir {city.name}'],
  ['src/app/(public)/nos-recommandations/_components/RecommendationCard.tsx', 'Voir le lieu'],
  ['src/app/(public)/map/_components/GuestMap.tsx', 'Voir la fiche'],
  ['src/app/admin/page.tsx', 'Acquisition'],
  ['src/app/admin/trails/page.tsx', 'Ouvrir'],
  ['src/app/admin/poi-acquisition/page.tsx', 'Détails'],
  ['src/app/admin/cities/page.tsx', 'Voir le guide'],
]

describe('031 AC-01-18 — boutons sans flèche', () => {
  it.each(buttons)('%s : « %s » n’est suivi d’aucune flèche', (file, label) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    const index = source.indexOf(label)
    expect(index).toBeGreaterThan(-1)
    const after = source.slice(index, source.indexOf('</', index))
    expect(after).not.toMatch(/ArrowRight|ArrowUpRight|→/)
  })
})
