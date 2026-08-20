export const LODGING_COOKIE_NAME = 'lodging_id'
export const LODGING_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function lodgingBearerCookie(
  value: string,
  maxAge = LODGING_COOKIE_MAX_AGE_SECONDS,
) {
  return {
    name: LODGING_COOKIE_NAME,
    value,
    httpOnly: true,
    maxAge,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
}
