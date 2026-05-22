// src/shared/lib/supabase.ts
import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (Client Components)
export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Route handler / Server Action client (reads + writes cookies)
export function createSupabaseRouteClient() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set(name, '', options)
      },
    },
  })
}

// Service role client (admin operations, bypasses RLS)
export function createSupabaseServer() {
  return createServerClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )
}

// Middleware client (reads + writes request/response cookies)
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set(name, value)
        response.cookies.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set(name, '')
        response.cookies.set(name, '', options)
      },
    },
  })
}
