import { NextResponse } from 'next/server'
import { getFacilibusVehicles } from '@/features/transport/facilibus'
import { transportJson } from '@/features/transport/lib/http'

/** Positions des navettes Facilibus, sans plaque ni identifiant de boîtier (spec 055 AC-04-04). */
export async function GET(): Promise<NextResponse> {
  return transportJson(await getFacilibusVehicles(), 15)
}
