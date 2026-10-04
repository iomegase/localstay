import { fr } from '@/features/guide-i18n/messages/fr'
import { en } from '@/features/guide-i18n/messages/en'

type Tree = { [key: string]: unknown }

function leaves(tree: Tree, prefix = ''): Array<[string, unknown]> {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? leaves(value as Tree, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value] as [string, unknown]],
  )
}

describe('061 AC-01-05 — dictionnaires complets', () => {
  const frLeaves = new Map(leaves(fr))
  const enLeaves = new Map(leaves(en))

  it('les deux langues ont exactement les mêmes clés', () => {
    expect([...enLeaves.keys()].sort()).toEqual([...frLeaves.keys()].sort())
  })

  // Vide volontairement : « closes at 19:00 » (pas de suffixe « H » en anglais).
  const INTENTIONALLY_EMPTY = new Set(['hours.hourSuffix'])

  it('aucune traduction vide, même type (texte ou fonction) dans les deux langues', () => {
    for (const [key, value] of frLeaves) {
      const translated = enLeaves.get(key)
      expect(typeof translated).toBe(typeof value)
      if (typeof translated === 'string' && !INTENTIONALLY_EMPTY.has(key)) expect(translated.trim()).not.toBe('')
    }
  })
})
