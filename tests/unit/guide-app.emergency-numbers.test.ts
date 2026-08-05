import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'

describe('French emergency numbers (hard-coded)', () => {
  it('exposes only the 112 and 114 emergency numbers', () => {
    const numbers = FRENCH_EMERGENCY_NUMBERS.map(entry => entry.number)

    expect(numbers).toEqual(['112', '114'])
  })

  it('leads with 112 and labels every entry', () => {
    expect(FRENCH_EMERGENCY_NUMBERS[0]?.number).toBe('112')
    expect(
      FRENCH_EMERGENCY_NUMBERS.every(entry => entry.label.trim().length > 0),
    ).toBe(true)
  })
})
