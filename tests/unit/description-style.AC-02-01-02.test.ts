import { DESCRIPTION_STYLE_INSTRUCTION, findHollowPhrases } from '@/shared/lib/description-style'
import { DESCRIPTION_LENGTH_INSTRUCTION } from '@/shared/lib/description-length'

describe('098 AC-02-01 — consigne anti-remplissage commune', () => {
  it('is part of the shared instruction used by every generator', () => {
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain(DESCRIPTION_STYLE_INSTRUCTION)
    expect(DESCRIPTION_STYLE_INSTRUCTION).toContain('fait vérifiable')
    expect(DESCRIPTION_STYLE_INSTRUCTION).toContain('« incontournable »')
    expect(DESCRIPTION_STYLE_INSTRUCTION).toContain('Ne cite ni horaires')
  })
})

describe('098 AC-02-02 — détection des formules creuses', () => {
  it('finds hollow phrases, case- and apostrophe-insensitive', () => {
    expect(findHollowPhrases('Le Bistrot Lulu est un lieu où l’on se sent bien, une adresse INCONTOURNABLE.'))
      .toEqual(expect.arrayContaining(['incontournable', "un lieu où l'on se sent bien"]))
    expect(findHollowPhrases('Que vous soyez skieur ou randonneur, venez.')).toContain('que vous soyez… ou…')
  })

  it('ignores factual text and partial words', () => {
    expect(findHollowPhrases('Pizzas sur base tomate ou crème, à emporter, face à l’église.')).toEqual([])
    expect(findHollowPhrases('Chalet nicheur d’oiseaux')).toEqual([])
  })
})
