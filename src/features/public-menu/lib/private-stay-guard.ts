import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  getActiveLodgingContext,
  LODGING_COOKIE_NAME,
  type LodgingModeContext,
} from './lodging-mode'

function ensureExpectedCity(
  lodgingContext: LodgingModeContext | null,
  expectedCitySlug?: string,
): LodgingModeContext {
  if (
    !lodgingContext ||
    (expectedCitySlug !== undefined &&
      lodgingContext.citySlug !== expectedCitySlug)
  ) {
    redirect('/acces-reserve')
  }

  return lodgingContext
}

export async function requireActiveLodgingContext(
  expectedCitySlug?: string,
): Promise<LodgingModeContext> {
  const lodgingContext = await getActiveLodgingContext()
  return ensureExpectedCity(lodgingContext, expectedCitySlug)
}

export async function getOptionalActiveLodgingContext(
  expectedCitySlug: string,
): Promise<LodgingModeContext | null> {
  const cookieStore = await cookies()
  const lodgingCookie = cookieStore.get(LODGING_COOKIE_NAME)

  if (lodgingCookie === undefined) return null

  return requireActiveLodgingContext(expectedCitySlug)
}
