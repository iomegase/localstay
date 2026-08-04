import { formatFrenchPhone, frenchPhoneHref } from '@/shared/lib/french-phone'

describe('formatFrenchPhone', () => {
  it('formats a 10-digit French number to spaced international form', () => {
    expect(formatFrenchPhone('0450785678')).toBe('+33 4 50 78 56 78')
    expect(formatFrenchPhone('0612345678')).toBe('+33 6 12 34 56 78')
  })

  it('ignores separators in the input', () => {
    expect(formatFrenchPhone('04 50 78 56 78')).toBe('+33 4 50 78 56 78')
    expect(formatFrenchPhone('04.50.78.56.78')).toBe('+33 4 50 78 56 78')
  })

  it('normalizes an already international number', () => {
    expect(formatFrenchPhone('+33 4 50 78 56 78')).toBe('+33 4 50 78 56 78')
    expect(formatFrenchPhone('0033450785678')).toBe('+33 4 50 78 56 78')
  })

  it('leaves short emergency codes untouched', () => {
    expect(formatFrenchPhone('112')).toBe('112')
    expect(formatFrenchPhone('15')).toBe('15')
    expect(formatFrenchPhone('3624')).toBe('3624')
  })

  it('returns the trimmed original when it cannot format', () => {
    expect(formatFrenchPhone('  injoignable ')).toBe('injoignable')
  })
})

describe('frenchPhoneHref', () => {
  it('builds an E.164 tel: href for 10-digit numbers', () => {
    expect(frenchPhoneHref('0450785678')).toBe('tel:+33450785678')
    expect(frenchPhoneHref('+33 4 50 78 56 78')).toBe('tel:+33450785678')
  })

  it('keeps short codes as-is', () => {
    expect(frenchPhoneHref('112')).toBe('tel:112')
  })
})
