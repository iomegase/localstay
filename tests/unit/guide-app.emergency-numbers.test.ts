import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'

describe('French emergency numbers (hard-coded)', () => {
  it('exposes the core fixed French emergency numbers', () => {
    const numbers = FRENCH_EMERGENCY_NUMBERS.map(entry => entry.number)

    expect(numbers).toEqual(
      expect.arrayContaining(['112', '15', '18', '17', '114', '115', '119']),
    )
  })

  it('leads with 112 and labels every entry', () => {
    expect(FRENCH_EMERGENCY_NUMBERS[0]?.number).toBe('112')
    expect(
      FRENCH_EMERGENCY_NUMBERS.every(entry => entry.label.trim().length > 0),
    ).toBe(true)
  })
})
