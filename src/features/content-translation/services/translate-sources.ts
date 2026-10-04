import { translateWithDeepl } from '@/shared/lib/deepl'
import { hashSourceText, translationKey, type TranslationSource } from '../lib/sources'

export type TranslationStore = {
  findExisting: (sources: TranslationSource[]) => Promise<Array<{ entity_type: string; entity_id: string; field_name: string; source_text_hash: string; status: string }>>
  save: (source: TranslationSource, result: { ok: true; text: string } | { ok: false; error: string }) => Promise<void>
}

export type TranslateResult = {
  translated: number
  failed: number
  remaining: number
  skipped?: 'NO_PROVIDER_KEY'
}

type Options = {
  config: { apiKey: string; baseUrl?: string } | null
  store: TranslationStore
  translate?: (texts: string[], config: { apiKey: string; baseUrl?: string }) => Promise<string[]>
  /** Plafond de champs traduits par exécution (061 A1 AC-02-01). */
  limit?: number
  batchSize?: number
}

/**
 * Traduit les champs dont la traduction anglaise manque, a échoué ou porte
 * l'empreinte d'un ancien texte (027 AC-02-01 / AC-02-03). Jamais bloquant pour
 * le rendu : appelé par la tâche planifiée ou après la réponse.
 */
export async function translateSources(
  sources: TranslationSource[],
  { config, store, translate = (texts, cfg) => translateWithDeepl(texts, cfg), limit = 200, batchSize = 50 }: Options,
): Promise<TranslateResult> {
  const candidates = sources.filter(source => source.text.trim() !== '')
  if (!config) return { translated: 0, failed: 0, remaining: candidates.length, skipped: 'NO_PROVIDER_KEY' }

  const existing = new Map(
    (await store.findExisting(candidates)).map(row => [translationKey(row.entity_type, row.entity_id, row.field_name), row]),
  )
  const pending = candidates.filter(source => {
    const row = existing.get(translationKey(source.entityType, source.entityId, source.field))
    return !row || row.status === 'failed' || row.source_text_hash !== hashSourceText(source.text)
  })
  const todo = pending.slice(0, limit)

  let translated = 0
  let failed = 0
  for (let start = 0; start < todo.length; start += batchSize) {
    const batch = todo.slice(start, start + batchSize)
    try {
      const texts = await translate(batch.map(source => source.text.trim()), config)
      for (const [index, source] of batch.entries()) {
        await store.save(source, { ok: true, text: texts[index] })
        translated += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DEEPL_UNKNOWN'
      for (const source of batch) {
        await store.save(source, { ok: false, error: message })
        failed += 1
      }
    }
  }

  return { translated, failed, remaining: pending.length - todo.length }
}
