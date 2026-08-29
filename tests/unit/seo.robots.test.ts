import robots from '@/app/robots'

const privateCrawlTargets = [
  '/sejour',
  '/sejour/logement',
  '/guide',
  '/guide/annecy',
  '/guide/annecy/restaurants/adresse-locale',
  '/acces-reserve',
  '/le-logement',
  '/nos-recommandations',
  '/map',
  '/mes-favoris',
  '/contact',
  '/services-prives',
]

function robotsPatternMatchesPath(pattern: string, path: string): boolean {
  const isEndAnchored = pattern.endsWith('$')
  const patternWithoutAnchor = isEndAnchored ? pattern.slice(0, -1) : pattern
  const expression = patternWithoutAnchor
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('*', '.*')

  return new RegExp(`^${expression}${isEndAnchored ? '$' : ''}`).test(path)
}

describe('robots.txt', () => {
  const realBase = process.env.NEXT_PUBLIC_BASE_URL

  afterEach(() => {
    if (realBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = realBase
  })

  it('allows public crawling but disallows private areas', () => {
    const result = robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rule.allow).toBe('/')
    expect(rule.disallow).toEqual(expect.arrayContaining(['/admin', '/dashboard', '/api', '/merchant']))
  })

  it.each(privateCrawlTargets)('keeps the private noindex surface %s crawlable', (path) => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const matchingDisallowRules = rules.flatMap((rule) => {
      const disallow = typeof rule.disallow === 'string'
        ? [rule.disallow]
        : rule.disallow ?? []

      return disallow.filter((pattern) => robotsPatternMatchesPath(pattern, path))
    })

    expect(matchingDisallowRules).toEqual([])
  })

  it('points to the sitemap on the configured base URL', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://mystay.example.com/'
    const result = robots()
    expect(result.sitemap).toBe('https://mystay.example.com/sitemap.xml')
    expect(result.host).toBe('https://mystay.example.com')
  })
})
