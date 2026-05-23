import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import type { User } from '@prisma/client'

type SessionOwnerResult =
  | { owner: User; error: null }
  | { owner: null; error: NextResponse }

export async function getSessionOwner(): Promise<SessionOwnerResult> {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      owner: null,
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
        { status: 401 },
      ),
    }
  }

  const owner = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null, is_active: true },
  })

  if (!owner) {
    return {
      owner: null,
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
        { status: 401 },
      ),
    }
  }

  if (owner.role !== 'owner') {
    return {
      owner: null,
      error: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Accès réservé aux hébergeurs' } },
        { status: 403 },
      ),
    }
  }

  return { owner, error: null }
}
