import { z } from 'zod'
import { normalizeGeographicLabel } from '@/shared/lib/editorial-label'

export const CityUpdateSchema = z.object({
  name: z.string().transform(normalizeGeographicLabel).pipe(z.string().min(2, 'Le nom doit contenir au moins 2 caractères.').max(120)),
  postal_code: z.string().trim().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres.'),
  // 2026-10-08 : site de l'office de tourisme (« https:// » facultatif), conservé sous forme d'origine.
  tourism_site_url: z.preprocess(
    value => (typeof value === 'string' ? normalizeTourismSiteUrl(value) : value),
    z.string().url('Adresse du site de l’office de tourisme invalide.').nullable().optional(),
  ),
}).strict()

/** « lescontamines.com/ete » → « https://lescontamines.com » ; vide → null. */
export function normalizeTourismSiteUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    if (!url.hostname.includes('.')) return trimmed
    return `https://${url.hostname}`
  } catch {
    return trimmed
  }
}

export type CityUpdateInput = z.infer<typeof CityUpdateSchema>
