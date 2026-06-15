import { revalidatePath } from 'next/cache'

export function revalidatePublicLodgingPaths() {
  revalidatePath('/guide/[city-slug]/logements', 'page')
  revalidatePath('/guide/[city-slug]/logements/[lodging-slug]', 'page')
  revalidatePath('/sitemap.xml')
}
