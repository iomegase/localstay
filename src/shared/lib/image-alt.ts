/** Spec 042 AC-08-03/04 — identifiants techniques exclus des descriptions. */
export function isTechnicalImageAlt(value: string): boolean {
  const text = value.trim()
  if (!text || /^https?:\/\//i.test(text) || /\.(?:avif|webp|jpe?g|png|gif|heic|svg)(?:\?.*)?$/i.test(text)) return true
  const compact = text.replace(/[\s_-]/g, '')
  return /^(?:photo)?[0-9a-f]{32}$/i.test(compact)
    || /^(?:IMG|DSC|DSCN|PXL)[\s_-]?\d+(?:[\s_-]\d+)*$/i.test(text)
}
