// Spec 074 AC-02-01 : devenir des images de remplacement, annoncé avant suppression.
export function fallbackDeletionNotice(
  target: { kind: 'category' } | { kind: 'subcategory'; categoryName: string },
  count: number,
): string | null {
  if (count <= 0) return null
  const images = count > 1 ? `${count} images de remplacement` : '1 image de remplacement'
  return target.kind === 'category'
    ? `${images} ${count > 1 ? 'repasseront' : 'repassera'} dans « Non classées ».`
    : `${images} ${count > 1 ? 'remonteront' : 'remontera'} dans « ${target.categoryName} ».`
}
