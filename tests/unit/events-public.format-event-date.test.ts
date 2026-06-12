import { formatEventDate } from '@/features/events-public/lib/format-event-date'

describe('formatEventDate', () => {
  it('affiche une seule date pour un événement d’un jour', () => {
    expect(formatEventDate(new Date('2026-06-13'), new Date('2026-06-13'))).toBe('13 juin 2026')
  })
  it('affiche une plage « du … au … » dans le même mois', () => {
    expect(formatEventDate(new Date('2026-06-13'), new Date('2026-06-15'))).toBe('du 13 au 15 juin 2026')
  })
  it('affiche les deux mois quand ils diffèrent', () => {
    expect(formatEventDate(new Date('2026-06-30'), new Date('2026-07-02'))).toBe('du 30 juin au 2 juillet 2026')
  })
  it('affiche les deux années quand elles diffèrent', () => {
    expect(formatEventDate(new Date('2026-12-31'), new Date('2027-01-01'))).toBe('du 31 décembre 2026 au 1 janvier 2027')
  })
})
