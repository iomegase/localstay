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
  ['src/features/local-seo/components/LocalServiceLanding.tsx', '{content.cta_label}'],
  ['src/features/marketing/components/MarketingHome.tsx', 'Découvrir'],
  ['src/features/lodging-showcase/components/LodgingLocationMap.tsx', 'Itinéraire'],
  ['src/app/(public)/le-logement/page.tsx', 'Ouvrir dans Maps'],
  ['src/features/lodging-showcase/components/LodgingShowcaseForm.tsx', 'Avant</Button>'],
  ['src/features/lodging-showcase/components/LodgingShowcaseForm.tsx', 'Après</Button>'],
]

// AC-01-19 : plus aucune icône fléchée dans ces composants d'interface.
const arrowFree = [
  'src/features/public-discovery/components/DiscoveryCityView.tsx',
  'src/features/public-discovery/components/DiscoveryIndexView.tsx',
  'src/features/public-discovery/components/DiscoveryPoiCard.tsx',
  'src/features/marketing/components/MarketingMobileMenu.tsx',
  'src/features/marketing/components/GuidePhoneShowcase.tsx',
  'src/features/local-seo/components/LocalServiceLanding.tsx',
  'src/app/(public)/le-logement/page.tsx',
]

describe('031 AC-01-18 — boutons sans flèche', () => {
  it.each(buttons)('%s : « %s » n’est suivi d’aucune flèche', (file, label) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    const index = source.indexOf(label)
    expect(index).toBeGreaterThan(-1)
    const after = source.slice(index, source.indexOf('</', index))
    expect(after).not.toMatch(/ArrowRight|ArrowUpRight|→|←/)
  })

  it.each(arrowFree)('%s : aucune icône fléchée', file => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    expect(source).not.toMatch(/<(ArrowRight|ArrowUpRight)\b/)
  })
})
