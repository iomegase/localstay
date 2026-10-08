// Spec 019 AC-01-07: reserve time for persistence before the platform deadline.
// 2026-10-08 : 270 s de travail sur les 300 s de la route (30 s gardées pour l'enregistrement).
export const IMPORT_WORK_BUDGET_MS = 270_000
export const IMPORT_SOURCE_TIMEOUT_MS = 65_000
export const IMPORT_ENRICHMENT_TIMEOUT_MS = 35_000
/** Dénivelé IGN : appels séquentiels (limite de l'API), ~1 s par tracé. */
export const IMPORT_IGN_TIMEOUT_MS = 60_000
/** Descriptions Gemini (120 à 300 mots, recherche web) : étape la plus lente, placée en dernier. */
export const IMPORT_DESCRIPTION_TIMEOUT_MS = 120_000
export const IMPORT_STALE_AFTER_MS = 10 * 60_000

export async function runWithDeadline<T>(
  deadline: number,
  limitMs: number,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const remaining = Math.min(limitMs, deadline - Date.now())
  if (remaining <= 0) throw new Error('Budget de temps de l’import épuisé')
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('Délai dépassé ; résultats déjà acquis conservés')
          controller.abort(error)
          reject(error)
        }, remaining)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
