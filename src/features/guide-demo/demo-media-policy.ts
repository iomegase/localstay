export const APPROVED_DEMO_LODGING_MEDIA = [
  '/marketing/guide-interior.png',
  '/marketing/demo-lodging-1.webp',
  '/marketing/demo-lodging-2.webp',
  '/marketing/demo-lodging-3.webp',
] as const

const approvedDemoLodgingMedia = new Set<string>(
  APPROVED_DEMO_LODGING_MEDIA,
)

export function isApprovedDemoLodgingMedia(value: string): boolean {
  return approvedDemoLodgingMedia.has(value)
}
