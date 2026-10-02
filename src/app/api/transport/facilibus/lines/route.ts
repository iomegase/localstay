import { NextResponse } from 'next/server'
import { getFacilibusLines } from '@/features/transport/facilibus'
import { transportJson } from '@/features/transport/lib/http'

/** Tracés des lignes Facilibus aux couleurs officielles (spec 058 AC-01-01). */
export async function GET(): Promise<NextResponse> {
  return transportJson(await getFacilibusLines(), 3600)
}
