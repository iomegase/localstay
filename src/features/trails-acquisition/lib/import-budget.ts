// Spec 019 AC-01-07: reserve time for persistence before the platform deadline.
export const IMPORT_WORK_BUDGET_MS = 210_000
export const IMPORT_SOURCE_TIMEOUT_MS = 65_000
export const IMPORT_ENRICHMENT_TIMEOUT_MS = 35_000
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
