import { z } from 'zod'

// Spec 101 AC-02-04 : crédit d'une photo sous licence libre (Wikimedia Commons).
const creditSchema = z.object({
  photo_url: z.string().url(),
  author: z.string().min(1),
  license: z.string().min(1),
  license_url: z.string().url().nullable(),
  source_url: z.string().url(),
})

export type OpenPhotoCredit = z.infer<typeof creditSchema>
/** Crédits regroupés par auteur et licence ; une source (page du fichier) par photo. */
export type OpenPhotoCreditGroup = { author: string; license: string; license_url: string | null; sources: string[] }

export function parseOpenPhotoCredits(value: unknown): OpenPhotoCredit[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    const parsed = creditSchema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

/** Spec 101 AC-02-05 : crédits des seules photos encore affichées (URL d'origine). */
export function groupOpenPhotoCredits(value: unknown, shownPhotos: string[]): OpenPhotoCreditGroup[] {
  const shown = new Set(shownPhotos)
  const groups = new Map<string, OpenPhotoCreditGroup>()
  for (const credit of parseOpenPhotoCredits(value)) {
    if (!shown.has(credit.photo_url)) continue
    const key = `${credit.author}\u0000${credit.license}`
    const group = groups.get(key) ?? { author: credit.author, license: credit.license, license_url: credit.license_url, sources: [] }
    group.sources.push(credit.source_url)
    groups.set(key, group)
  }
  return [...groups.values()]
}
