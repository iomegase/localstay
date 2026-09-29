import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'

describe('French emergency numbers (hard-coded)', () => {
  it('exposes only the 112 emergency number (spec 050 AC-01-05)', () => {
    const numbers = FRENCH_EMERGENCY_NUMBERS.map(entry => entry.number)

    expect(numbers).toEqual(['112'])
  })

  it('leads with 112 and labels every entry', () => {
    expect(FRENCH_EMERGENCY_NUMBERS[0]?.number).toBe('112')
    expect(
      FRENCH_EMERGENCY_NUMBERS.every(entry => entry.label.trim().length > 0),
    ).toBe(true)
  })
})
