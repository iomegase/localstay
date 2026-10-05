/** Spec 046 AC-06-05 : territoire local validé, sans distance calculée. */
export const conciergeLodgingCitySlugs = [
  'saint-gervais-les-bains',
  'saint-nicolas-de-veroce',
  'les-contamines-montjoie',
  'megeve',
  'combloux',
]

export function selectConciergeLodgings<T extends { id: string; city_slug: string }>(
  lodgings: T[], citySlug: string,
): T[] {
  const eligible = lodgings.filter(lodging => conciergeLodgingCitySlugs.includes(lodging.city_slug))
  const ordered = [
    ...eligible.filter(lodging => lodging.city_slug === citySlug),
    ...eligible.filter(lodging => lodging.city_slug !== citySlug),
  ]
  return ordered.filter((lodging, index) => ordered.findIndex(item => item.id === lodging.id) === index).slice(0, 3)
}
