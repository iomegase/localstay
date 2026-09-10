import { revalidatePath } from 'next/cache'

export function revalidatePublicLodgingPaths(
  citySlugs: readonly (string | null | undefined)[],
  lodgingSlugs: readonly (string | null | undefined)[] = [],
) {
  revalidatePath('/logements', 'page')
  revalidatePath('/logements/[lodging-slug]', 'page')
  revalidatePath('/sitemap.xml')
  revalidatePath('/confier-mon-logement', 'page')
  revalidatePath('/seminaires', 'page')
  revalidatePath('/conciergerie/[city-slug]', 'page')
  for (const slug of new Set(citySlugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/locations-vacances/${encodeURIComponent(slug)}`, 'page')
  }
  for (const slug of new Set(lodgingSlugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/logements/${encodeURIComponent(slug)}`, 'page')
  }
}
