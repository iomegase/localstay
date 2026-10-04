import { z } from 'zod'

/** Spec 061 A1 BR-09 : clé Free (suffixe « :fx ») → API Free, sinon API Pro. */
export function deeplBaseUrl(apiKey: string, override: string | undefined): string {
  if (override?.trim()) return override.trim().replace(/\/+$/, '')
  return apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
}

const responseSchema = z.object({ translations: z.array(z.object({ text: z.string() })) })

type DeeplOptions = {
  apiKey: string
  baseUrl?: string
  fetchImpl?: typeof fetch
}

/**
 * Traduit des textes français en anglais britannique (spec 027 BR-22/23, 061).
 * Appel serveur uniquement ; la clé n'est jamais exposée au client.
 */
export async function translateWithDeepl(texts: string[], { apiKey, baseUrl, fetchImpl = fetch }: DeeplOptions): Promise<string[]> {
  if (texts.length === 0) return []
  const response = await fetchImpl(`${deeplBaseUrl(apiKey, baseUrl)}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: texts, source_lang: 'FR', target_lang: 'EN-GB', preserve_formatting: true }),
  })
  if (!response.ok) throw new Error(`DEEPL_HTTP_${response.status}`)
  const parsed = responseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success || parsed.data.translations.length !== texts.length) throw new Error('DEEPL_BAD_RESPONSE')
  return parsed.data.translations.map(translation => translation.text)
}

/** Configuration lue dans l'environnement serveur ; null sans clé (061 A1 AC-02-05). */
export function deeplConfigFromEnv(): { apiKey: string; baseUrl?: string } | null {
  const apiKey = process.env.DEEPL_API_KEY?.trim()
  if (!apiKey) return null
  return { apiKey, baseUrl: process.env.DEEPL_API_BASE_URL }
}
