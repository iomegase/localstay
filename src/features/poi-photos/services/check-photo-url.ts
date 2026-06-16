import { isDeadPhotoResponse } from '../lib/liveness'

const USER_AGENT = 'Mozilla/5.0 (compatible; MyStayBot/1.0; +https://mystay.city)'
const TIMEOUT_MS = 5000

function classify(res: Response): 'alive' | 'dead' {
  return isDeadPhotoResponse({ status: res.status, contentType: res.headers.get('content-type') })
    ? 'dead'
    : 'alive'
}

async function safeFetch(url: string, method: 'HEAD' | 'GET'): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Vérifie la vivacité d'une URL de photo (HEAD, repli GET si HEAD non supporté). */
export async function checkPhotoUrl(url: string): Promise<'alive' | 'dead'> {
  const head = await safeFetch(url, 'HEAD')
  if (head && head.status !== 405 && head.status !== 501) {
    return classify(head)
  }
  const get = await safeFetch(url, 'GET')
  return get ? classify(get) : 'dead'
}
