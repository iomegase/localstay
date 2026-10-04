/*
 * Service worker du guide installé — spec 059 US-02.
 *
 * - Pages du logement : réseau d'abord, cache en secours (AC-02-01 / AC-02-02).
 * - Autres pages du guide : réseau, page hors-ligne en secours (AC-02-03).
 * - /_next/static, icônes, polices : cache d'abord (fichiers immuables).
 * - Tout le reste (API, dashboard, admin, Mapbox…) n'est jamais intercepté (BR-02).
 * - Un seul séjour en cache : une page d'un autre logement vide le cache (BR-03).
 *
 * Écrit à la main (pas de plugin) : Next 16 compile avec Turbopack.
 * Les fonctions sont exportées pour les tests unitaires (Node).
 */

const PAGE_CACHE = 'mystay-guide-v1'
const STATIC_CACHE = 'mystay-static-v2'

function isDevelopment() {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('development') === '1'
}
const OFFLINE_URL = '/sejour/hors-ligne'
// En-tête posé par le proxy sur les pages /sejour servies avec un séjour actif.
const LODGING_HEADER = 'x-mystay-guide-lodging'
const LODGING_MARKER = '/__mystay/guide-lodging'
const GUIDE_PAGES = [
  '/sejour',
  '/sejour/logement',
  '/sejour/logement/arrivee',
  '/sejour/logement/consignes',
  '/sejour/logement/informations-pratiques',
  '/sejour/logement/depart',
]
const STATIC_ASSET = /^\/(?:_next\/static\/|mystay-logo-approved\/)|\.(?:woff2?|ttf|otf)$/
const NEXT_STATIC_URL = /\/_next\/static\/[^"'\s)\\]+/g

function classifyRequest(request) {
  if (isDevelopment()) return 'network'
  if (request.method !== 'GET') return 'network'
  const url = new URL(request.url)
  if (typeof location !== 'undefined' && url.origin !== location.origin) return 'network'
  if (url.pathname.startsWith('/api/')) return 'network'
  if (STATIC_ASSET.test(url.pathname)) return 'static'
  if (request.mode !== 'navigate') return 'network'
  if (GUIDE_PAGES.includes(url.pathname)) return 'guide-page'
  if (url.pathname.startsWith('/sejour/') || url.pathname.startsWith('/guide/')) return 'guide-other'
  return 'network'
}

function lodgingOf(response) {
  return response && response.ok && !response.redirected ? response.headers.get(LODGING_HEADER) : null
}

async function storeGuidePage(path, response, lodgingId, deps) {
  if (!lodgingId) return
  const cache = await deps.caches.open(PAGE_CACHE)
  const marker = await cache.match(LODGING_MARKER)
  const cachedLodging = marker ? await marker.text() : null
  if (cachedLodging && cachedLodging !== lodgingId) {
    await deps.caches.delete(PAGE_CACHE)
    return storeGuidePage(path, response, lodgingId, deps)
  }
  if (!cachedLodging) await cache.put(LODGING_MARKER, new Response(lodgingId))
  await cache.put(path, response)
}

async function handleGuideNavigation(request, deps) {
  const path = new URL(request.url).pathname
  const isLodgingPage = GUIDE_PAGES.includes(path)
  try {
    const response = await deps.fetch(request)
    if (isLodgingPage) await storeGuidePage(path, response.clone(), lodgingOf(response), deps)
    return response
  } catch (error) {
    const cache = await deps.caches.open(PAGE_CACHE)
    const cached = isLodgingPage ? await cache.match(path) : undefined
    if (cached) return cached
    const offline = await cache.match(OFFLINE_URL)
    if (offline) return offline
    throw error
  }
}

async function handleStatic(request, deps) {
  const cache = await deps.caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await deps.fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

async function precacheGuide(lodgingId, deps) {
  if (isDevelopment()) return
  const assets = new Set()
  for (const path of [...GUIDE_PAGES, OFFLINE_URL]) {
    try {
      const response = await deps.fetch(path, { credentials: 'same-origin' })
      if (lodgingOf(response) !== lodgingId) continue
      const html = await response.clone().text()
      for (const asset of html.match(NEXT_STATIC_URL) || []) assets.add(asset)
      await storeGuidePage(path, response, lodgingId, deps)
    } catch {
      // Réseau coupé pendant le pré-cache : la page sera mise en cache à sa prochaine visite.
    }
  }
  const statics = await deps.caches.open(STATIC_CACHE)
  for (const asset of assets) {
    try {
      if (await statics.match(asset)) continue
      const response = await deps.fetch(asset)
      if (response.ok) await statics.put(asset, response)
    } catch {
      // Idem : asset récupéré à la prochaine visite en ligne.
    }
  }
}

async function clearGuide(deps) {
  await deps.caches.delete(PAGE_CACHE)
}

if (typeof module !== 'undefined') {
  module.exports = {
    GUIDE_PAGES,
    OFFLINE_URL,
    PAGE_CACHE,
    STATIC_CACHE,
    LODGING_HEADER,
    classifyRequest,
    handleGuideNavigation,
    handleStatic,
    precacheGuide,
    clearGuide,
  }
}

if (typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  const deps = { caches: self.caches, fetch: (input, init) => self.fetch(input, init) }

  self.addEventListener('install', () => self.skipWaiting())

  self.addEventListener('activate', event => {
    event.waitUntil((async () => {
      const keep = [PAGE_CACHE, STATIC_CACHE]
      for (const name of await caches.keys()) {
        if (name.startsWith('mystay-') && !keep.includes(name)) await caches.delete(name)
      }
      await self.clients.claim()
    })())
  })

  self.addEventListener('fetch', event => {
    const kind = classifyRequest(event.request)
    if (kind === 'guide-page' || kind === 'guide-other') {
      event.respondWith(handleGuideNavigation(event.request, deps))
    } else if (kind === 'static') {
      event.respondWith(handleStatic(event.request, deps))
    }
  })

  self.addEventListener('message', event => {
    const data = event.data || {}
    if (data.type === 'PRECACHE_GUIDE' && typeof data.lodgingId === 'string') {
      event.waitUntil(precacheGuide(data.lodgingId, deps))
    } else if (data.type === 'CLEAR_GUIDE') {
      event.waitUntil(clearGuide(deps))
    }
  })
}
