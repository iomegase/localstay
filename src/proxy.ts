import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/shared/lib/supabase'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'
import {
  LODGING_COOKIE_NAME,
  lodgingBearerCookie,
} from '@/features/public-menu/lib/lodging-cookie'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

// Écran de blocage affiché quand on accède au site sans séjour actif.
const GATE_PATH = '/acces-reserve'
// Préfixes accessibles sans séjour actif (espace hôte + écran de blocage lui-même).
const BYPASS_PREFIXES = ['/auth', GATE_PATH]
const ANONYMOUS_MARKETING_EXACT_PATHS = new Set([
  '/',
  '/concept',
  '/seminaires',
  '/confier-mon-logement',
  '/connexion',
  '/logements',
  '/blog',
  '/decouvrir',
])
const ANONYMOUS_MARKETING_PREFIXES = ['/logements/', '/blog/', '/decouvrir/']

// Confinement guest : sous /guide/{ville}, seuls ces 2ᵉ segments sont autorisés
// pour un visiteur en séjour (hors entrée QR ?lodging=). Tout le reste (page ville,
// catégories, météo…) est renvoyé vers l'accueil séjour.
const GUEST_ALLOWED_GUIDE_SEGMENTS = new Set(['logements', 'agenda', 'mes-favoris', 'contact'])

function isLegacyDiscoveryGuidePath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'guide' || !segments[1]) return false

  if (segments.length === 2) return true
  if (segments.length > 4) return false

  const guideSegment = segments[2]
  return Boolean(
    guideSegment && !GUEST_ALLOWED_GUIDE_SEGMENTS.has(guideSegment),
  )
}

export function isAnonymousMarketingPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const isPublicLodgingDetail =
    segments.length === 4 &&
    segments[0] === 'guide' &&
    segments[2] === 'logements'

  return (
    ANONYMOUS_MARKETING_EXACT_PATHS.has(pathname) ||
    ANONYMOUS_MARKETING_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
    isPublicLodgingDetail
  )
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isMarketingRoute = isAnonymousMarketingPath(path)
  const isGuideAppRoute = path === '/sejour' || path.startsWith('/sejour/')
  const requestHeaders = new Headers(request.headers)

  if (isMarketingRoute) {
    requestHeaders.set('x-staylocal-marketing-route', '1')
  }
  if (isGuideAppRoute) {
    requestHeaders.set('x-staylocal-guide-app-route', '1')
  }

  const response = NextResponse.next(
    isMarketingRoute || isGuideAppRoute
      ? {
        request: {
          headers: requestHeaders,
        },
      }
      : undefined,
  )

  // === Branche publique : /guide/:path* — point d'entrée séjour, jamais bloqué ===
  if (path.startsWith('/guide/')) {
    const lodgingFromQuery = request.nextUrl.searchParams.get('lodging')
    if (lodgingFromQuery && UUID_REGEX.test(lodgingFromQuery)) {
      const cookie = lodgingBearerCookie(lodgingFromQuery)

      // La City rejoint toujours la home privée. Une Category/fiche POI ne peut
      // continuer que si le cookie de la requête porte déjà le même Lodging :
      // un cookie posé sur la réponse n'est pas encore visible par le Server
      // Component courant et déclencherait à tort la migration SEO anonyme.
      // Les routes réservées logement, agenda et démarrage randonnée conservent
      // leur comportement historique et rafraîchissent seulement le cookie.
      if (isLegacyDiscoveryGuidePath(path)) {
        const segments = path.split('/').filter(Boolean)
        const isCityLanding = segments.length === 2
        const currentLodgingCookie = request.cookies.get(LODGING_COOKIE_NAME)?.value
        const canContinuePrivateNavigation =
          !isCityLanding && currentLodgingCookie === lodgingFromQuery

        if (canContinuePrivateNavigation) {
          response.cookies.set(cookie)
          return response
        }

        const destination = new URL('/sejour', request.url)
        destination.searchParams.set('lodging', lodgingFromQuery)
        const redirect = NextResponse.redirect(destination)
        redirect.cookies.set(cookie)
        return redirect
      }

      response.cookies.set(cookie)
      return response
    }

    // Confinement : hors entrée QR (?lodging=), un guest en séjour ne peut ouvrir
    // que les surfaces autorisées sous /guide/{ville} ; le reste redirige vers
    // l'accueil privé du séjour.
    const lodgingCookie = request.cookies.get(LODGING_COOKIE_NAME)?.value
    if (lodgingCookie && UUID_REGEX.test(lodgingCookie)) {
      const segments = path.split('/').filter(Boolean) // ['guide', ville, seg2?, seg3?…]
      const guideSegment = segments[2] ?? null
      // Fiche POI = /guide/{ville}/{categorie}/{poi} (≥ 4 segments) : autorisée
      // (accessible depuis recommandations / favoris / carte). Sont bloqués la page
      // ville (2 segments) et les listings de catégorie (3 segments non whitelistés).
      const isPoiDetail = segments.length >= 4
      const allowed = isPoiDetail || (guideSegment !== null && GUEST_ALLOWED_GUIDE_SEGMENTS.has(guideSegment))
      if (!allowed) {
        return NextResponse.redirect(new URL('/sejour', request.url))
      }
    }
    return response
  }

  // === Branche authentifiée : dashboard/merchant/admin ===
  const isDashboardArea =
    path.startsWith('/dashboard') || path.startsWith('/merchant') || path.startsWith('/admin')
  if (isDashboardArea) {
    const supabase = createSupabaseMiddlewareClient(request, response)
    const { data: { user } } = await supabase.auth.getUser()

    function redirectWithCookies(destination: string) {
      const redirect = NextResponse.redirect(new URL(destination, request.url), { status: 307 })
      response.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value))
      return redirect
    }

    if (!user) {
      return redirectWithCookies('/auth/login')
    }

    const role: unknown = user.user_metadata?.role

    if (role !== 'owner' && role !== 'merchant' && role !== 'admin') {
      return redirectWithCookies('/auth/login')
    }

    const ownDashboard = DASHBOARD_ROUTES[role]

    // BR-04: block cross-role access
    const otherPrefixes = Object.values(DASHBOARD_ROUTES).filter(p => p !== ownDashboard)
    for (const prefix of otherPrefixes) {
      if (path.startsWith(prefix)) {
        return redirectWithCookies(ownDashboard)
      }
    }

    return response
  }

  // === Espace hôte (auth) + écran de blocage : toujours accessibles ===
  if (BYPASS_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) {
    return response
  }

  // === Site éditorial public : accessible sans séjour actif ===
  if (isMarketingRoute) {
    return response
  }

  // Compatibilité des anciens liens privés : la nouvelle page canonique des
  // coups de cœur remplace l'interface historique sans rendre la route publique.
  if (path === '/nos-recommandations') {
    const lodgingCookie = request.cookies.get(LODGING_COOKIE_NAME)?.value
    if (lodgingCookie && UUID_REGEX.test(lodgingCookie)) {
      return NextResponse.redirect(
        new URL('/sejour/coups-de-coeur', request.url),
      )
    }
  }

  // === Pages invité (le-logement, recommandations, map…) ===
  // Accès réservé : il faut un séjour actif (cookie lodging valide), sinon on
  // affiche l'écran « accès par lien » sans changer l'URL.
  const lodgingCookie = request.cookies.get(LODGING_COOKIE_NAME)?.value
  const hasActiveLodging = Boolean(lodgingCookie && UUID_REGEX.test(lodgingCookie))
  if (!hasActiveLodging) {
    return NextResponse.rewrite(new URL(GATE_PATH, request.url))
  }

  return response
}

export const config = {
  // Tout le site sauf les fichiers statiques et les routes API.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
