import { revalidatePath } from 'next/cache'

export function revalidateAutoUnpublishedDiscovery(paths: string[]): void {
  if (paths.length === 0) return

  for (const path of paths) revalidatePath(path, 'page')
  revalidatePath('/sitemap.xml')
}
