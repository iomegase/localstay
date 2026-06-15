import { assertBlogGeminiScope } from '@/features/blog/lib/gemini-scope'

describe('029 blog gemini scope', () => {
  it('rejects requests asking for forbidden factual or realtime data', () => {
    expect(() =>
      assertBlogGeminiScope({
        brief: 'Rédige un article avec les prix des forfaits et les disponibilités de demain.',
        verifiedFacts: 'Ajoute aussi les distances précises entre les villages et les coordonnées GPS.',
      }),
    ).toThrow('FORBIDDEN_SCOPE')
  })

  it('accepts an editorial brief based on verified facts only', () => {
    expect(() =>
      assertBlogGeminiScope({
        brief: 'Rédige un article chaleureux pour présenter un week-end à Saint-Gervais.',
        verifiedFacts:
          'La ville dispose de thermes, de sentiers publiés dans le guide et de restaurants validés par l’équipe MyStay.',
      }),
    ).not.toThrow()
  })

  it('rejects personal data and unverified accusations', () => {
    expect(() =>
      assertBlogGeminiScope({
        brief: 'Rédige un article sur les mauvais côtés du village.',
        verifiedFacts:
          'Une personne se nomme Elodie et aurait volé 5000 euros. Les habitants sont violents.',
      }),
    ).toThrow('FORBIDDEN_SCOPE')
  })
})
