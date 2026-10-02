import { NextResponse } from 'next/server'
import { getFacilibusStations } from '@/features/transport/facilibus'
import { transportJson } from '@/features/transport/lib/http'

/** Stations physiques Facilibus (spec 055 AC-02-01). */
export async function GET(): Promise<NextResponse> {
  return transportJson(await getFacilibusStations(), 3600)
}
