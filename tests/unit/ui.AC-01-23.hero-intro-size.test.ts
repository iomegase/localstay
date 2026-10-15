import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Spec 031 AC-01-23 : introduction des heros marketing en 15 px, sans variation responsive.
const heroIntros: [string, string][] = [
  ['src/features/marketing/components/MarketingHome.tsx', 'MyStay accompagne les locations saisonnières'],
  ['src/app/(public)/seminaires/page.tsx', 'Réunir vos équipes. Prendre de la hauteur.'],
  ['src/app/(public)/logements/page.tsx', 'Chaque logement est accompagné'],
  ['src/app/(public)/journal/page.tsx', 'Sélectionnez une catégorie'],
  ['src/app/(public)/confier-mon-logement/page.tsx', '<p className="mt-6 text-[15px]'],
  ['src/features/marketing/components/LegalPage.tsx', '{intro}'],
  ['src/features/local-seo/components/LocalVacationRentalLanding.tsx', '{content.hero_copy}'],
  ['src/features/local-seo/components/LocalServiceLanding.tsx', '{content.hero_copy}'],
  ['src/features/local-seo/components/LocalConciergeLanding.tsx', '{content.hero_copy}'],
  ['src/features/public-discovery/components/DiscoveryIndexView.tsx', 'MyStay réunit ici'],
  ['src/features/public-discovery/components/DiscoveryCityView.tsx', '{cityIntroduction(city)}'],
]

describe('031 AC-01-23 — introduction des heros en 15 px', () => {
  it.each(heroIntros)('%s', (file, marker) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    const index = source.indexOf(marker)
    expect(index).toBeGreaterThan(-1)
    const start = source.lastIndexOf('<p', index)
    const tag = source.slice(start, source.indexOf('>', start) + 1)
    expect(tag).toContain('text-[15px]')
    expect(tag).not.toMatch(/(sm|md|lg|xl):text-|(^|\s)text-(sm|base|lg)(\s|"|$)/)
  })
})
