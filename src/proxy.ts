import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/shared/lib/supabase'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'
import type { Role } from '@/shared/types/roles'

const LODGING_COOKIE_NAME = 'lodging_id'
const LODGING_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 jours
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const path = request.nextUrl.pathname

  // === Branche publique : /guide/:path* — pas d'auth, juste le cookie séjour ===
  if (path.startsWith('/guide/')) {
    const lodgingFromQuery = request.nextUrl.searchParams.get('lodging')
    if (lodgingFromQuery && UUID_REGEX.test(lodgingFromQuery)) {
      const cookie = {
        name: LODGING_COOKIE_NAME,
        value: lodgingFromQuery,
        maxAge: LODGING_COOKIE_MAX_AGE_SECONDS,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      }

      // Atterrissage du QR séjour = /guide/{ville} (2 segments exactement).
      // On dépose alors le guest sur la home « Bienvenue » (/) qui affiche
      // LodgingHome grâce au cookie. ?lodging= est transporté pour que la home
      // enregistre l'évènement qr_scan. La navigation interne plus profonde
      // (/guide/{ville}/{categorie}…) porte aussi ?lodging= : on se contente
      // alors de rafraîchir le cookie, sans rediriger.
      const isCityLanding = path.split('/').filter(Boolean).length === 2
      if (isCityLanding) {
        const destination = new URL('/', request.url)
        destination.searchParams.set('lodging', lodgingFromQuery)
        const redirect = NextResponse.redirect(destination)
        redirect.cookies.set(cookie)
        return redirect
      }

      response.cookies.set(cookie)
    }
    return response
  }

  // === Branche authentifiée : dashboard/merchant/admin ===
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

  const role = (user.user_metadata?.role ?? 'tourist') as Role

  if (role === 'tourist') {
    return redirectWithCookies('/')
  }

  const ownDashboard = DASHBOARD_ROUTES[role as Exclude<Role, 'tourist'>]

  // BR-04: block cross-role access
  const otherPrefixes = Object.values(DASHBOARD_ROUTES).filter(p => p !== ownDashboard)
  for (const prefix of otherPrefixes) {
    if (path.startsWith(prefix)) {
      return redirectWithCookies(ownDashboard)
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/merchant/:path*', '/admin/:path*', '/guide/:path*'],
}
