import { demoPois } from '@/features/guide-demo/demo-pois'

describe('045 AC-02-04 autonomous public demo trail actions', () => {
  it('shows Porcherey metrics without enabling trail tracking or a private start path', () => {
    const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')

    expect(porcherey?.trail).toMatchObject({
      difficulty: 'easy',
      distanceKm: 8.3,
      elevationGainM: 709,
      estimatedDurationMinutes: 210,
      trackingEnabled: false,
    })
    expect(JSON.stringify(porcherey)).not.toMatch(/\/start|trackingEnabled":true/)
  })
})
