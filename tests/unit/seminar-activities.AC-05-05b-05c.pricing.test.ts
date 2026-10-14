import {
  SIMULATOR_DEFAULT_PARTICIPANTS,
  centsToEurosInput,
  formatEuros,
  parseEurosToCents,
  simulateActivityTotal,
  ttcCents,
} from '@/features/seminar-activities/lib/pricing'
import { SEMINAR_LEVEL_OPTIONS, SEMINAR_SEASON_OPTIONS, optionsWithCurrent } from '@/features/seminar-activities/lib/options'
import { SEMINAR_ACTIVITY_CATALOG } from '@/features/seminar-activities/lib/catalog'

describe('spec 097 AC-05b — TVA 20 %', () => {
  it.each([
    [0, 0],
    [1, 1],
    [3, 4],
    [4500, 5400],
    [12345, 14814],
    [99999, 119999],
  ])('HT %i c → TTC %i c, arrondi au centime', (ht, ttc) => {
    expect(ttcCents(ht)).toBe(ttc)
  })
})

describe('spec 097 AC-05c — simulateur 1 à 30 participants', () => {
  it('défaut à 10 participants (décision PO du 2026-10-14)', () => {
    expect(SIMULATOR_DEFAULT_PARTICIPANTS).toBe(10)
  })

  it.each([1, 10, 30])('prix/pers. × %i + forfait groupe, en HT et TTC', participants => {
    const total = simulateActivityTotal({ price_per_person_cents: 4500, price_per_group_cents: 20000 }, participants)
    expect(total.htCents).toBe(4500 * participants + 20000)
    expect(total.ttcCents).toBe(ttcCents(4500 * participants + 20000))
  })

  it('un prix absent compte pour 0 et le forfait groupe ne dépend pas de N', () => {
    expect(simulateActivityTotal({ price_per_person_cents: null, price_per_group_cents: 50000 }, 3).htCents).toBe(50000)
    expect(simulateActivityTotal({ price_per_person_cents: null, price_per_group_cents: 50000 }, 30).htCents).toBe(50000)
    expect(simulateActivityTotal({ price_per_person_cents: 2500, price_per_group_cents: null }, 12).htCents).toBe(30000)
    expect(simulateActivityTotal({ price_per_person_cents: null, price_per_group_cents: null }, 10)).toEqual({ htCents: 0, ttcCents: 0 })
  })

  it.each([0, 31, 2.5, -1])('refuse %p participants', participants => {
    expect(() => simulateActivityTotal({ price_per_person_cents: 100, price_per_group_cents: null }, participants)).toThrow(RangeError)
  })
})

describe('spec 097 AC-05 — saisie admin en euros', () => {
  it.each([
    ['', null],
    ['  ', null],
    ['45', 4500],
    ['45,5', 4550],
    ['45.50', 4550],
    ['1 200,00', 120000],
    ['0,29', 29],
  ])('« %s » → %p centimes', (input, cents) => {
    expect(parseEurosToCents(input)).toBe(cents)
  })

  it.each(['-5', '12,345', 'abc', '1,2,3'])('« %s » est invalide', input => {
    expect(parseEurosToCents(input)).toBeUndefined()
  })

  it('formate et relit les montants', () => {
    expect(centsToEurosInput(4550)).toBe('45,50')
    expect(centsToEurosInput(null)).toBe('')
    expect(formatEuros(120000).replace(/\s/g, ' ')).toBe('1 200,00 €')
  })
})

describe('spec 097 UI admin — listes saison et niveau', () => {
  it('couvrent toutes les valeurs du catalogue, sans doublon', () => {
    for (const item of SEMINAR_ACTIVITY_CATALOG) {
      expect(SEMINAR_SEASON_OPTIONS).toContain(item.season_label)
      expect(SEMINAR_LEVEL_OPTIONS).toContain(item.level_label)
    }
    expect(new Set(SEMINAR_SEASON_OPTIONS).size).toBe(SEMINAR_SEASON_OPTIONS.length)
    expect(new Set(SEMINAR_LEVEL_OPTIONS).size).toBe(SEMINAR_LEVEL_OPTIONS.length)
  })

  it('conserve une valeur enregistrée hors liste', () => {
    expect(optionsWithCurrent(['A', 'B'], 'Libre')).toEqual(['Libre', 'A', 'B'])
    expect(optionsWithCurrent(['A', 'B'], 'A')).toEqual(['A', 'B'])
    expect(optionsWithCurrent(['A', 'B'], '')).toEqual(['A', 'B'])
  })
})
