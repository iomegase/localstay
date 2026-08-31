import { revalidatePath } from 'next/cache'

export function revalidatePublicLodgingPaths() {
  revalidatePath('/logements', 'page')
  revalidatePath('/logements/[lodging-slug]', 'page')
  revalidatePath('/sitemap.xml')
}
