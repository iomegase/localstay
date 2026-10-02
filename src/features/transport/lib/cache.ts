type Entry = { value: unknown; fetchedAt: number; expiresAt: number }

// Cache mémoire PAR INSTANCE serveur (non durable) : mutualise les appels au
// fournisseur entre visiteurs ; le partage entre instances passe par les en-têtes
// `Cache-Control: s-maxage` des routes (CDN).
const store = new Map<string, Entry>()
const inflight = new Map<string, Promise<unknown>>()

export type CachedValue<T> = { value: T; fetchedAt: number; stale: boolean }

/**
 * Valeur fraîche si son TTL court encore ; sinon rechargement mutualisé. En cas
 * d'échec, la dernière valeur valide est servie si elle a moins de `maxStaleMs`,
 * marquée `stale` — jamais présentée comme fraîche.
 */
export async function cachedLoad<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  maxStaleMs: number,
  now: () => number = Date.now,
): Promise<CachedValue<T>> {
  const entry = store.get(key)
  if (entry && entry.expiresAt > now()) {
    return { value: entry.value as T, fetchedAt: entry.fetchedAt, stale: false }
  }

  let pending = inflight.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = loader()
    inflight.set(key, pending)
  }
  try {
    const value = await pending
    const fetchedAt = now()
    if (inflight.get(key) === pending) store.set(key, { value, fetchedAt, expiresAt: fetchedAt + ttlMs })
    const stored = store.get(key) ?? { value, fetchedAt }
    return { value: stored.value as T, fetchedAt: stored.fetchedAt, stale: false }
  } catch (error) {
    if (entry && now() - entry.fetchedAt <= maxStaleMs) {
      return { value: entry.value as T, fetchedAt: entry.fetchedAt, stale: true }
    }
    throw error
  } finally {
    if (inflight.get(key) === pending) inflight.delete(key)
  }
}

/** Réservé aux tests. */
export function resetTransportCache() {
  store.clear()
  inflight.clear()
}
