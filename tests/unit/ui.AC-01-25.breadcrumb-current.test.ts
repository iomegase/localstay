import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { breadcrumbCurrentClass } from '@/features/marketing/components/marketing-styles'

// Spec 031 AC-01-25 : dernier élément des fils d'Ariane en pink-600, pink-400 au survol.
describe('031 AC-01-25 — dernier élément du fil d’Ariane en rose', () => {
  it('defines the shared class', () => {
    expect(breadcrumbCurrentClass.split(' ')).toEqual(expect.arrayContaining(['text-pink-600', 'hover:text-pink-400']))
  })

  it.each([
    'src/app/(public)/journal/page.tsx',
    'src/features/public-discovery/components/DiscoveryCategoryView.tsx',
    'src/features/public-discovery/components/DiscoveryPoiView.tsx',
  ])('%s applique la classe au dernier élément (aria-current="page")', file => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    expect(source).toMatch(/aria-current="page" className=\{breadcrumbCurrentClass\}/)
  })
})
