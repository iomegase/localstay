/**
 * Spec 011 AC-01-01 : URL encodée dans le QR d'un logement.
 * Base `NEXT_PUBLIC_BASE_URL` (comme le QR ville), slash final retiré (…app//guide).
 */
export function lodgingQrUrl(citySlug: string, lodgingId: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')
  return `${baseUrl}/guide/${citySlug}?lodging=${lodgingId}`
}
