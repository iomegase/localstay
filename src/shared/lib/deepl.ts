import { z } from 'zod'

/** Spec 061 A1 BR-09 : clé Free (suffixe « :fx ») → API Free, sinon API Pro. */
export function deeplBaseUrl(apiKey: string, override: string | undefined): string {
  if (override?.trim()) return override.trim().replace(/\/+$/, '')
  return apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
}

const responseSchema = z.object({ translations: z.array(z.object({ text: z.string() })) })

// Spec 061 A2 BR-10 : toute suite d'au moins 4 chiffres (digicode, code de boîte, numéro).
const SENSITIVE_TOKEN = /[A-Za-z0-9#*]*\d[A-Za-z0-9#*-]*/g
const PLACEHOLDER = /<m i="(\d+)"\s*\/>/g

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function unescapeXml(text: string): string {
  return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

/** Remplace les codes par des balises neutres : ils ne quittent jamais le serveur. */
export function maskSensitive(text: string): { xml: string; secrets: string[] } {
  const secrets: string[] = []
  const xml = escapeXml(text).replace(SENSITIVE_TOKEN, token => {
    if ((token.match(/\d/g) ?? []).length < 4) return token
    secrets.push(token)
    return `<m i="${secrets.length - 1}"/>`
  })
  return { xml, secrets }
}

export function restoreSensitive(xml: string, secrets: string[]): string {
  return unescapeXml(xml.replace(PLACEHOLDER, (_match, index: string) => secrets[Number(index)] ?? ''))
}

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
  const masked = texts.map(maskSensitive)
  const response = await fetchImpl(`${deeplBaseUrl(apiKey, baseUrl)}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: masked.map(item => item.xml),
      source_lang: 'FR',
      target_lang: 'EN-GB',
      preserve_formatting: true,
      tag_handling: 'xml',
    }),
  })
  if (!response.ok) throw new Error(`DEEPL_HTTP_${response.status}`)
  const parsed = responseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success || parsed.data.translations.length !== texts.length) throw new Error('DEEPL_BAD_RESPONSE')
  return parsed.data.translations.map((translation, index) => restoreSensitive(translation.text, masked[index].secrets))
}

/** Configuration lue dans l'environnement serveur ; null sans clé (061 A1 AC-02-05). */
export function deeplConfigFromEnv(): { apiKey: string; baseUrl?: string } | null {
  const apiKey = process.env.DEEPL_API_KEY?.trim()
  if (!apiKey) return null
  return { apiKey, baseUrl: process.env.DEEPL_API_BASE_URL }
}
