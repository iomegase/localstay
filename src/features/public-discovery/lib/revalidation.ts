import { revalidatePath } from 'next/cache'

export function safelyRevalidateDiscoveryPaths(paths: string[]): void {
  if (paths.length === 0) return

  for (const path of [...new Set(paths)]) safelyRevalidatePath(path, 'page')
  safelyRevalidatePath('/sitemap.xml')
}

function safelyRevalidatePath(path: string, type?: 'page'): void {
  try {
    if (type) revalidatePath(path, type)
    else revalidatePath(path)
  } catch (error) {
    console.error('Discovery cache revalidation failed', { path, error })
  }
}
