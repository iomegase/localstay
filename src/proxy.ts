import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/shared/lib/supabase'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'
import type { Role } from '@/shared/types/roles'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseMiddlewareClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

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
  matcher: ['/dashboard/:path*', '/merchant/:path*', '/admin/:path*'],
}
