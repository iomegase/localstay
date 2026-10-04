import { deeplBaseUrl, translateWithDeepl } from '@/shared/lib/deepl'

describe('061 A1 BR-09 — client DeepL', () => {
  it('choisit l’API Free pour une clé « :fx », Pro sinon, et respecte la surcharge', () => {
    expect(deeplBaseUrl('abc:fx', undefined)).toBe('https://api-free.deepl.com')
    expect(deeplBaseUrl('abc', undefined)).toBe('https://api.deepl.com')
    expect(deeplBaseUrl('abc:fx', 'https://proxy.example/')).toBe('https://proxy.example')
  })

  it('envoie les textes en un lot FR → EN-GB, mise en forme préservée', async () => {
    const fetchImpl = jest.fn(async () => new Response(JSON.stringify({ translations: [{ text: 'TV' }, { text: 'Hair dryer' }] }), { status: 200 }))
    const result = await translateWithDeepl(['Télévision', 'Sèche-cheveux'], { apiKey: 'k:fx', fetchImpl })
    expect(result).toEqual(['TV', 'Hair dryer'])
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api-free.deepl.com/v2/translate')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('DeepL-Auth-Key k:fx')
    expect(JSON.parse(String(init.body))).toEqual({
      text: ['Télévision', 'Sèche-cheveux'],
      source_lang: 'FR',
      target_lang: 'EN-GB',
      preserve_formatting: true,
    })
  })

  it('ne fait aucun appel pour une liste vide', async () => {
    const fetchImpl = jest.fn()
    expect(await translateWithDeepl([], { apiKey: 'k', fetchImpl })).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('lève une erreur explicite si DeepL refuse (quota, clé invalide…)', async () => {
    const fetchImpl = jest.fn(async () => new Response('quota', { status: 456 }))
    await expect(translateWithDeepl(['x'], { apiKey: 'k', fetchImpl })).rejects.toThrow('DEEPL_HTTP_456')
  })

  it('lève une erreur si le nombre de traductions ne correspond pas', async () => {
    const fetchImpl = jest.fn(async () => new Response(JSON.stringify({ translations: [] }), { status: 200 }))
    await expect(translateWithDeepl(['x'], { apiKey: 'k', fetchImpl })).rejects.toThrow('DEEPL_BAD_RESPONSE')
  })
})
