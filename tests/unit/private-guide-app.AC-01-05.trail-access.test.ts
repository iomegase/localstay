import { canStartTrail } from '@/features/guide-app/lib/trail-access'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('private guide trail access helper', () => {
  it('keeps demo Porcherey metrics visible without enabling trail tracking', () => {
    const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')

    expect(porcherey?.trail).toMatchObject({
      difficulty: 'easy',
      distanceKm: 8.3,
      elevationGainM: 709,
      estimatedDurationMinutes: 210,
      trackingEnabled: false,
    })
    expect(canStartTrail('demo', porcherey?.trail)).toBe(false)
  })

  it('requires both private mode and an explicitly enabled trail', () => {
    const enabledTrail = {
      difficulty: 'medium' as const,
      estimatedDurationMinutes: 90,
      distanceKm: 5,
      elevationGainM: 300,
      startLabel: 'Départ',
      trackingEnabled: true,
    }

    expect(canStartTrail('demo', enabledTrail)).toBe(false)
    expect(canStartTrail('private', enabledTrail)).toBe(true)
    expect(canStartTrail('private', undefined)).toBe(false)
  })
})
