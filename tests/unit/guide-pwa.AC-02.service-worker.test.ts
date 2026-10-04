/** Spec 059 US-02 / BR-02 / BR-03 : stratégie de cache du service worker (public/sw.js). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sw = require('../../public/sw.js') as {
  GUIDE_PAGES: string[]
  OFFLINE_URL: string
  PAGE_CACHE: string
  STATIC_CACHE: string
  LODGING_HEADER: string
  classifyRequest: (request: Request) => string
  handleGuideNavigation: (request: Request, deps: Deps) => Promise<Response>
  handleStatic: (request: Request, deps: Deps) => Promise<Response>
  precacheGuide: (lodgingId: string, deps: Deps) => Promise<void>
  clearGuide: (deps: Deps) => Promise<void>
}

type Deps = { caches: FakeCaches; fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> }

const ORIGIN = 'https://www.mystay.city'
const LODGING_ID = '11111111-1111-4111-8111-111111111111'
const OTHER_ID = '22222222-2222-4222-8222-222222222222'

class FakeCache {
  store = new Map<string, Response>()
  private key(input: RequestInfo | URL) {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, ORIGIN)
    return url.pathname + url.search
  }
  async match(input: RequestInfo | URL) { return this.store.get(this.key(input))?.clone() }
  async put(input: RequestInfo | URL, response: Response) { this.store.set(this.key(input), response) }
  async keys() { return [...this.store.keys()].map(k => new Request(ORIGIN + k)) }
}

class FakeCaches {
  map = new Map<string, FakeCache>()
  async open(name: string) {
    if (!this.map.has(name)) this.map.set(name, new FakeCache())
    return this.map.get(name)!
  }
  async delete(name: string) { return this.map.delete(name) }
  async keys() { return [...this.map.keys()] }
}

function navigation(path: string) {
  const request = new Request(ORIGIN + path)
  Object.defineProperty(request, 'mode', { value: 'navigate' })
  return request
}

function guideHtml(lodgingId: string | null, body = '<html><script src="/_next/static/chunks/app.js"></script><link href="/_next/static/css/a.css"></html>') {
  const headers = new Headers({ 'content-type': 'text/html' })
  if (lodgingId) headers.set(sw.LODGING_HEADER, lodgingId)
  return new Response(body, { status: 200, headers })
}

describe('classifyRequest — BR-02 : périmètre du cache', () => {
  it.each([
    ['/sejour', 'guide-page'],
    ['/sejour?lodging=x&source=pwa', 'guide-page'],
    ['/sejour/logement', 'guide-page'],
    ['/sejour/logement/arrivee', 'guide-page'],
    ['/sejour/logement/consignes', 'guide-page'],
    ['/sejour/logement/informations-pratiques', 'guide-page'],
    ['/sejour/logement/depart', 'guide-page'],
    ['/sejour/coups-de-coeur', 'guide-other'],
    ['/guide/chamonix/explorer/aiguille-du-midi', 'guide-other'],
    ['/dashboard', 'network'],
    ['/admin/lodgings', 'network'],
    ['/', 'network'],
  ])('navigation %s → %s', (path, expected) => {
    expect(sw.classifyRequest(navigation(path))).toBe(expected)
  })

  it.each([
    [`${ORIGIN}/_next/static/chunks/app.js`, 'static'],
    [`${ORIGIN}/mystay-logo-approved/mystay-app-icon-approved.png`, 'static'],
    [`${ORIGIN}/fonts/plus-jakarta.woff2`, 'static'],
    [`${ORIGIN}/api/guide/manifest?lodging=x`, 'network'],
    [`${ORIGIN}/api/guide/stay-events`, 'network'],
    ['https://api.mapbox.com/styles/v1/tiles/1/2/3', 'network'],
    [`${ORIGIN}/sejour/logement?_rsc=abc`, 'network'],
  ])('ressource %s → %s', (url, expected) => {
    expect(sw.classifyRequest(new Request(url))).toBe(expected)
  })

  it('ne touche jamais aux requêtes non GET', () => {
    expect(sw.classifyRequest(new Request(`${ORIGIN}/sejour`, { method: 'POST' }))).toBe('network')
  })
})

describe('handleGuideNavigation — AC-02-01 / AC-02-02 / AC-02-03', () => {
  it('AC-02-02: réseau d’abord, et met à jour le cache sous le chemin sans paramètres', async () => {
    const caches = new FakeCaches()
    const fetch = jest.fn(async () => guideHtml(LODGING_ID, 'frais'))
    const res = await sw.handleGuideNavigation(navigation(`/sejour?lodging=${LODGING_ID}&source=pwa`), { caches, fetch })
    expect(await res.text()).toBe('frais')
    const cached = await (await caches.open(sw.PAGE_CACHE)).match('/sejour')
    expect(await cached?.text()).toBe('frais')
  })

  it('AC-02-01: hors-ligne, sert la page du logement depuis le cache', async () => {
    const caches = new FakeCaches()
    await (await caches.open(sw.PAGE_CACHE)).put('/sejour/logement/arrivee', guideHtml(LODGING_ID, 'en cache'))
    const fetch = jest.fn(async () => { throw new TypeError('offline') })
    const res = await sw.handleGuideNavigation(navigation('/sejour/logement/arrivee'), { caches, fetch })
    expect(await res.text()).toBe('en cache')
  })

  it('AC-02-03: hors-ligne sans cache, sert la page hors-ligne', async () => {
    const caches = new FakeCaches()
    await (await caches.open(sw.PAGE_CACHE)).put(sw.OFFLINE_URL, new Response('hors-ligne'))
    const fetch = jest.fn(async () => { throw new TypeError('offline') })
    const res = await sw.handleGuideNavigation(navigation('/sejour/coups-de-coeur'), { caches, fetch })
    expect(await res.text()).toBe('hors-ligne')
  })

  it('ne met jamais en cache une réponse sans séjour (écran d’accès réécrit)', async () => {
    const caches = new FakeCaches()
    const fetch = jest.fn(async () => guideHtml(null, 'accès réservé'))
    await sw.handleGuideNavigation(navigation('/sejour'), { caches, fetch })
    expect(await (await caches.open(sw.PAGE_CACHE)).match('/sejour')).toBeUndefined()
  })

  it('BR-03: une page d’un autre logement vide d’abord le cache du séjour précédent', async () => {
    const caches = new FakeCaches()
    const fetchA = jest.fn(async () => guideHtml(LODGING_ID, 'A'))
    await sw.handleGuideNavigation(navigation('/sejour/logement/depart'), { caches, fetch: fetchA })
    const fetchB = jest.fn(async () => guideHtml(OTHER_ID, 'B'))
    await sw.handleGuideNavigation(navigation('/sejour'), { caches, fetch: fetchB })
    const cache = await caches.open(sw.PAGE_CACHE)
    expect(await cache.match('/sejour/logement/depart')).toBeUndefined()
    expect(await (await cache.match('/sejour'))?.text()).toBe('B')
  })
})

describe('handleStatic — assets immuables', () => {
  it('cache d’abord, réseau sinon', async () => {
    const caches = new FakeCaches()
    const fetch = jest.fn(async () => new Response('js'))
    const request = new Request(`${ORIGIN}/_next/static/chunks/app.js`)
    expect(await (await sw.handleStatic(request, { caches, fetch })).text()).toBe('js')
    expect(await (await sw.handleStatic(request, { caches, fetch })).text()).toBe('js')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('precacheGuide — AC-02-01 : première ouverture en ligne', () => {
  it('met en cache les 6 pages, la page hors-ligne et leurs assets /_next/static', async () => {
    const caches = new FakeCaches()
    const fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/_next/static/')) return new Response('asset')
      return guideHtml(LODGING_ID)
    })
    await sw.precacheGuide(LODGING_ID, { caches, fetch })

    const pages = await caches.open(sw.PAGE_CACHE)
    for (const path of [...sw.GUIDE_PAGES, sw.OFFLINE_URL]) {
      expect(await pages.match(path)).toBeDefined()
    }
    const statics = await caches.open(sw.STATIC_CACHE)
    expect(await statics.match('/_next/static/chunks/app.js')).toBeDefined()
    expect(await statics.match('/_next/static/css/a.css')).toBeDefined()
  })

  it('ignore les pages servies pour un autre logement', async () => {
    const caches = new FakeCaches()
    const fetch = jest.fn(async () => guideHtml(OTHER_ID))
    await sw.precacheGuide(LODGING_ID, { caches, fetch })
    expect(await (await caches.open(sw.PAGE_CACHE)).match('/sejour')).toBeUndefined()
  })
})

describe('clearGuide — AC-03-02 : vider le cache à l’expiration', () => {
  it('supprime les pages du séjour', async () => {
    const caches = new FakeCaches()
    await (await caches.open(sw.PAGE_CACHE)).put('/sejour', guideHtml(LODGING_ID))
    await sw.clearGuide({ caches, fetch: jest.fn() })
    expect(await caches.keys()).not.toContain(sw.PAGE_CACHE)
  })
})

 describe('AC-02-02: développement sans anciennes ressources en cache', () => {
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location')
  beforeEach(() => {
    Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: ORIGIN, search: '?development=1' } })
  })
  afterEach(() => {
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation)
    else Reflect.deleteProperty(globalThis, 'location')
  })
  it('laisse les scripts et pages au réseau', () => {
    expect(sw.classifyRequest(new Request(`${ORIGIN}/_next/static/chunks/app.js`))).toBe('network')
    expect(sw.classifyRequest(navigation('/sejour/logement/consignes'))).toBe('network')
  })
  it('ne précharge aucune ancienne ressource en développement', async () => {
    const caches = new FakeCaches()
    const fetch = jest.fn()
    await sw.precacheGuide(LODGING_ID, { caches, fetch })
    expect(fetch).not.toHaveBeenCalled()
    expect(await caches.keys()).toEqual([])
  })
  it('utilise une nouvelle version du cache statique', () => {
    expect(sw.STATIC_CACHE).toBe('mystay-static-v2')
  })
})
