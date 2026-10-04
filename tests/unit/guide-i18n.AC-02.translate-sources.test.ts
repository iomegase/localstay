import { hashSourceText, translationKey, type TranslationSource } from '@/features/content-translation/lib/sources'
import { translateSources, type TranslationStore } from '@/features/content-translation/services/translate-sources'

type Row = { entity_type: string; entity_id: string; field_name: string; source_text_hash: string; status: string; translated_text: string }

function memoryStore(initial: Row[] = []): TranslationStore & { rows: Map<string, Row> } {
  const rows = new Map(initial.map(row => [translationKey(row.entity_type, row.entity_id, row.field_name), row]))
  return {
    rows,
    findExisting: async () => [...rows.values()],
    save: async (source, result) => {
      rows.set(translationKey(source.entityType, source.entityId, source.field), {
        entity_type: source.entityType,
        entity_id: source.entityId,
        field_name: source.field,
        source_text_hash: hashSourceText(source.text),
        status: result.ok ? 'auto_translated' : 'failed',
        translated_text: result.ok ? result.text : '',
      })
    },
  }
}

const tv: TranslationSource = { entityType: 'LodgingPracticalBlock', entityId: 'b1', field: 'title', text: 'Télévision' }
const dryer: TranslationSource = { entityType: 'LodgingPracticalBlock', entityId: 'b2', field: 'title', text: 'Sèche cheveux' }
const poi: TranslationSource = { entityType: 'PointOfInterest', entityId: 'p1', field: 'description', text: 'Ancienne ferme de 1850' }

describe('061 A1 — traduction incrémentale', () => {
  it('hash stable du texte français (espaces de bord ignorés)', () => {
    expect(hashSourceText(' Télévision ')).toBe(hashSourceText('Télévision'))
    expect(hashSourceText('Télévision')).not.toBe(hashSourceText('Télévision HD'))
    expect(hashSourceText('x')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('AC-02-05: sans clé DeepL, rien n’est envoyé', async () => {
    const translate = jest.fn()
    const result = await translateSources([tv], { config: null, translate, store: memoryStore() })
    expect(result).toEqual({ translated: 0, failed: 0, remaining: 1, skipped: 'NO_PROVIDER_KEY' })
    expect(translate).not.toHaveBeenCalled()
  })

  it('AC-02-01: traduit uniquement les textes manquants', async () => {
    const store = memoryStore([{ entity_type: 'LodgingPracticalBlock', entity_id: 'b1', field_name: 'title', source_text_hash: hashSourceText('Télévision'), status: 'auto_translated', translated_text: 'TV' }])
    const translate = jest.fn(async (texts: string[]) => texts.map(text => `EN:${text}`))
    const result = await translateSources([tv, dryer, poi], { config: { apiKey: 'k:fx' }, translate, store })
    expect(translate).toHaveBeenCalledTimes(1)
    expect(translate.mock.calls[0][0]).toEqual(['Sèche cheveux', 'Ancienne ferme de 1850'])
    expect(result).toEqual({ translated: 2, failed: 0, remaining: 0 })
    expect(store.rows.get(translationKey('PointOfInterest', 'p1', 'description'))?.translated_text).toBe('EN:Ancienne ferme de 1850')
  })

  it('AC-02-03: un texte source modifié est retraduit', async () => {
    const store = memoryStore([{ entity_type: 'LodgingPracticalBlock', entity_id: 'b1', field_name: 'title', source_text_hash: hashSourceText('Télé'), status: 'auto_translated', translated_text: 'Telly' }])
    const translate = jest.fn(async (texts: string[]) => texts.map(() => 'TV'))
    await translateSources([tv], { config: { apiKey: 'k' }, translate, store })
    expect(translate.mock.calls[0][0]).toEqual(['Télévision'])
    expect(store.rows.get(translationKey('LodgingPracticalBlock', 'b1', 'title'))?.source_text_hash).toBe(hashSourceText('Télévision'))
  })

  it('AC-02-04: respecte le plafond et la taille des lots', async () => {
    const sources = Array.from({ length: 7 }, (_, index): TranslationSource => ({ entityType: 'PointOfInterest', entityId: `p${index}`, field: 'description', text: `Texte ${index}` }))
    const translate = jest.fn(async (texts: string[]) => texts.map(text => text))
    const result = await translateSources(sources, { config: { apiKey: 'k' }, translate, store: memoryStore(), limit: 5, batchSize: 2 })
    expect(translate.mock.calls.map(call => call[0].length)).toEqual([2, 2, 1])
    expect(result).toEqual({ translated: 5, failed: 0, remaining: 2 })
  })

  it('un lot en échec est marqué « failed » et sera retenté', async () => {
    const store = memoryStore()
    const translate = jest.fn(async () => { throw new Error('DEEPL_HTTP_456') })
    const result = await translateSources([tv], { config: { apiKey: 'k' }, translate, store })
    expect(result).toEqual({ translated: 0, failed: 1, remaining: 0 })
    const retry = jest.fn(async (texts: string[]) => texts.map(() => 'TV'))
    await translateSources([tv], { config: { apiKey: 'k' }, translate: retry, store })
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('ignore les textes vides', async () => {
    const translate = jest.fn(async (texts: string[]) => texts)
    const result = await translateSources([{ ...tv, text: '   ' }], { config: { apiKey: 'k' }, translate, store: memoryStore() })
    expect(translate).not.toHaveBeenCalled()
    expect(result.remaining).toBe(0)
  })
})
