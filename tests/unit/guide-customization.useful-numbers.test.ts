import {
  USEFUL_NUMBER_CATEGORIES,
  parseUsefulNumbers,
  serializeUsefulNumbers,
} from '@/features/guide-customization/lib/useful-numbers'

describe('useful numbers serialize / parse', () => {
  it('offers an "autre" category alongside presets', () => {
    const values = USEFUL_NUMBER_CATEGORIES.map(category => category.value)
    expect(values).toContain('autre')
    expect(values).toContain('tourisme')
  })

  it('serializes rows as "Label: phone" and drops incomplete rows', () => {
    const text = serializeUsefulNumbers([
      { category: 'tourisme', customLabel: '', phone: '04 50 47 76 08' },
      { category: 'pharmacie', customLabel: '', phone: '' }, // no phone → dropped
      { category: 'autre', customLabel: 'Boulangerie', phone: '04 50 11 22 33' },
      { category: 'autre', customLabel: '', phone: '06 00 00 00 00' }, // no label → dropped
    ])

    expect(text).toBe(
      'Office de tourisme: 04 50 47 76 08\nBoulangerie: 04 50 11 22 33',
    )
  })

  it('parses a known category label back to its preset value', () => {
    const rows = parseUsefulNumbers('Office de tourisme: 04 50 47 76 08')
    expect(rows).toEqual([
      { category: 'tourisme', customLabel: '', phone: '04 50 47 76 08' },
    ])
  })

  it('parses an unknown label as the "autre" category with a custom label', () => {
    const rows = parseUsefulNumbers('Boulangerie du village: 04 50 11 22 33')
    expect(rows).toEqual([
      {
        category: 'autre',
        customLabel: 'Boulangerie du village',
        phone: '04 50 11 22 33',
      },
    ])
  })

  it('round-trips rows through serialize then parse', () => {
    const rows = [
      { category: 'mairie', customLabel: '', phone: '04 50 47 75 66' },
      { category: 'autre', customLabel: 'Taxi Léon', phone: '06 12 34 56 78' },
    ]
    expect(parseUsefulNumbers(serializeUsefulNumbers(rows))).toEqual(rows)
  })

  it('treats empty or null input as no rows', () => {
    expect(parseUsefulNumbers(null)).toEqual([])
    expect(parseUsefulNumbers('   ')).toEqual([])
  })
})
