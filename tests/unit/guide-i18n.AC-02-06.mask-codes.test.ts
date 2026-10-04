import { maskSensitive, restoreSensitive, translateWithDeepl } from '@/shared/lib/deepl'

describe('061 A2 BR-10 — les codes ne sont jamais envoyés à DeepL', () => {
  it('remplace les suites d’au moins 4 chiffres par des balises et échappe le XML', () => {
    const { xml, secrets } = maskSensitive('Digicode à droite — code 225536 & badge <A1234>, étage 2')
    expect(xml).not.toContain('225536')
    expect(xml).not.toContain('A1234')
    expect(xml).toContain('étage 2')
    expect(xml).toContain('&amp;')
    expect(xml).toContain('&lt;')
    expect(secrets).toEqual(['225536', 'A1234'])
  })

  it('restaure les codes et le texte après traduction', () => {
    const { xml, secrets } = maskSensitive('Code 225536 & porte <B>')
    const translated = xml.replace('Code', 'Code').replace('porte', 'door')
    expect(restoreSensitive(translated, secrets)).toBe('Code 225536 & door <B>')
  })

  it('AC-02-06: la requête DeepL ne contient pas le code, la traduction si', async () => {
    const fetchImpl = jest.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { text: string[] }
      return new Response(JSON.stringify({ translations: body.text.map(text => ({ text: text.replace('Le digicode se trouve à droite de la porte du garage', 'The keypad is to the right of the garage door') })) }), { status: 200 })
    })
    const [result] = await translateWithDeepl(['Le digicode se trouve à droite de la porte du garage — code 225536'], { apiKey: 'k:fx', fetchImpl: fetchImpl as unknown as typeof fetch })
    const sent = String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body)
    expect(sent).not.toContain('225536')
    expect(JSON.parse(sent)).toMatchObject({ tag_handling: 'xml' })
    expect(result).toBe('The keypad is to the right of the garage door — code 225536')
  })
})
