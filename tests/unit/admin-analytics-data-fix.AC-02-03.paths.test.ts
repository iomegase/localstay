import { resolveAnalyticsCityContext } from '@/features/admin-analytics/lib/city-path-mapping'
import { isPrivateAnalyticsPath, PRIVATE_ANALYTICS_PATH_PREFIXES } from '@/features/admin-analytics/lib/private-paths'

// Spec 075 — chemins privés (BR-01) et rattachement aux villages (AC-03-01).
describe('075 BR-01 — chemins privés', () => {
  it.each(['/admin', '/admin/pois/abc', '/auth/login', '/login', '/dashboard/lodgings', '/merchant', '/connexion', '/acces-reserve', '/cities/x', '/api/x'])(
    '%s est privé', path => expect(isPrivateAnalyticsPath(path)).toBe(true),
  )

  it.each(['/', '/decouvrir/saint-gervais-les-bains', '/sejour', '/logements/le-305', '/administration-locale', '/authentique'])(
    '%s est public', path => expect(isPrivateAnalyticsPath(path)).toBe(false),
  )

  it('liste exposée pour les filtres GA4', () => {
    expect(PRIVATE_ANALYTICS_PATH_PREFIXES).toContain('/admin')
  })
})

describe('075 AC-03-01 — rattachement des chemins actuels', () => {
  it.each([
    ['/decouvrir/saint-gervais-les-bains', 'city_discovery'],
    ['/decouvrir/saint-gervais-les-bains/diner', 'city_discovery'],
    ['/decouvrir/saint-nicolas-de-veroce/diner/salon-de-the-armancette', 'city_discovery'],
    ['/conciergerie/saint-gervais-les-bains', 'city_concierge'],
    ['/seminaires/saint-gervais-les-bains', 'city_seminars'],
    ['/locations-vacances/saint-gervais-les-bains/', 'city_lodgings'],
  ])('%s → %s', (path, pageType) => {
    expect(resolveAnalyticsCityContext(path)).toEqual({ citySlug: path.split('/')[2], pageType })
  })

  it('pages globales inchangées', () => {
    expect(resolveAnalyticsCityContext('/decouvrir')).toEqual({ citySlug: null, pageType: 'global' })
    expect(resolveAnalyticsCityContext('/seminaires')).toEqual({ citySlug: null, pageType: 'global' })
  })
})
