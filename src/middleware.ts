// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/shared/lib/supabase'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'
import type { Role } from '@/shared/types/roles'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseMiddlewareClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl, { status: 307 })
  }

  const role = (user.user_metadata?.role ?? 'owner') as Role

  if (role === 'tourist') {
    return NextResponse.redirect(new URL('/', request.url), { status: 307 })
  }

  const ownDashboard = DASHBOARD_ROUTES[role as Exclude<Role, 'tourist'>]

  // BR-04: block cross-role access
  const otherPrefixes = Object.values(DASHBOARD_ROUTES).filter(p => p !== ownDashboard)
  for (const prefix of otherPrefixes) {
    if (path.startsWith(prefix)) {
      return NextResponse.redirect(new URL(ownDashboard, request.url), { status: 307 })
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/merchant/:path*', '/admin/:path*'],
}
