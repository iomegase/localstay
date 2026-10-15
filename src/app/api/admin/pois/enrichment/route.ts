import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { listDescriptionEnrichmentItems } from '@/features/admin-pois/queries/description-enrichment'

export const runtime = 'nodejs'

/** Spec 098 — GET /api/admin/pois/enrichment : POI publiés à description courte. */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const items = await listDescriptionEnrichmentItems()
  return NextResponse.json(
    // Contrat spec 098 : la description elle-même n'est pas renvoyée.
    { items: items.map(item => ({ id: item.id, name: item.name, city_name: item.city_name, category_name: item.category_name, word_count: item.word_count, public_path: item.public_path })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
