import robots from '@/app/robots'

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
    expect(rule.disallow).not.toEqual(expect.arrayContaining([
      '/sejour',
      '/guide',
      '/acces-reserve',
      '/le-logement',
      '/nos-recommandations',
      '/map',
      '/mes-favoris',
      '/contact',
      '/services-prives',
    ]))
  })

  it('points to the sitemap on the configured base URL', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://mystay.example.com/'
    const result = robots()
    expect(result.sitemap).toBe('https://mystay.example.com/sitemap.xml')
    expect(result.host).toBe('https://mystay.example.com')
  })
})
