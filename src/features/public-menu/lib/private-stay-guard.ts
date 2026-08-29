import { redirect } from 'next/navigation'
import {
  getActiveLodgingContext,
  type LodgingModeContext,
} from './lodging-mode'

export async function requireActiveLodgingContext(
  expectedCitySlug?: string,
): Promise<LodgingModeContext> {
  const lodgingContext = await getActiveLodgingContext()

  if (
    !lodgingContext ||
    (expectedCitySlug !== undefined &&
      lodgingContext.citySlug !== expectedCitySlug)
  ) {
    redirect('/acces-reserve')
  }

  return lodgingContext
}
