import { buildTrialMessage, calculateDaysRemaining } from '@/features/subscription-owner/subscription-detail'

describe('013 subscription owner trial detail', () => {
  it('AC-01-02: computes remaining trial days and displays the free-until message', () => {
    const now = new Date('2026-05-24T10:00:00.000Z')
    const trialEndsAt = new Date('2026-06-03T10:00:00.000Z')

    expect(calculateDaysRemaining(trialEndsAt, now)).toBe(10)
    expect(buildTrialMessage(trialEndsAt, now)).toBe('Gratuit jusqu’au 03/06/2026 · 10 jours restants')
  })

  it('AC-01-02: never returns negative remaining days', () => {
    const now = new Date('2026-05-24T10:00:00.000Z')
    const trialEndsAt = new Date('2026-05-20T10:00:00.000Z')

    expect(calculateDaysRemaining(trialEndsAt, now)).toBe(0)
  })
})
