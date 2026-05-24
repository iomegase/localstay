import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import type { User } from '@prisma/client'
import { apiError } from './responses'

type SessionResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse }

async function getSessionRole(role: 'merchant' | 'admin', forbiddenMessage: string): Promise<SessionResult> {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, error: apiError('UNAUTHORIZED', 'Non authentifié', 401) }
  }

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null, is_active: true },
  })

  if (!dbUser) {
    return { user: null, error: apiError('UNAUTHORIZED', 'Non authentifié', 401) }
  }

  if (dbUser.role !== role) {
    return { user: null, error: apiError('FORBIDDEN', forbiddenMessage, 403) }
  }

  return { user: dbUser, error: null }
}

export function getSessionMerchant(): Promise<SessionResult> {
  return getSessionRole('merchant', 'Accès réservé aux commerçants')
}

export function getSessionAdmin(): Promise<SessionResult> {
  return getSessionRole('admin', 'Accès réservé aux administrateurs')
}
