export const APPROVED_DEMO_LODGING_MEDIA = [
  '/marketing/guide-interior.png',
  '/marketing/demo-lodging-1.webp',
  '/marketing/demo-lodging-2.webp',
  '/marketing/demo-lodging-3.webp',
] as const

// Photos d'accès du logement vitrine, validées par le PO le 2026-09-29
// (AC-02-03). Réservées aux instructions d'arrivée, jamais à la galerie.
export const APPROVED_DEMO_ACCESS_MEDIA = [
  '/demo/acces-logement-trousseau.webp',
  '/demo/entree-batiment-interphone.webp',
  '/demo/parking-telecommande.webp',
] as const

const approvedDemoLodgingMedia = new Set<string>([
  ...APPROVED_DEMO_LODGING_MEDIA,
  ...APPROVED_DEMO_ACCESS_MEDIA,
])

export function isApprovedDemoLodgingMedia(value: string): boolean {
  return approvedDemoLodgingMedia.has(value)
}
