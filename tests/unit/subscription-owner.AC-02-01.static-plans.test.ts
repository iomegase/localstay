import { OWNER_PLAN_CATALOG, getOwnerPlanFeatures } from '@/features/subscription-owner/plans'

describe('013 static owner plan catalog', () => {
  it('AC-02-01: exposes the four indicative owner plans without database-backed Plan models', () => {
    expect(OWNER_PLAN_CATALOG.map((plan) => plan.slug)).toEqual([
      'discovery',
      'basic',
      'pro',
      'concierge',
    ])

    expect(OWNER_PLAN_CATALOG).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Découverte', price_label: 'Gratuit' }),
        expect.objectContaining({ name: 'Basic', price_label: '9-19€/logement' }),
        expect.objectContaining({ name: 'Pro', price_label: '29-49€/logement' }),
        expect.objectContaining({ name: 'Conciergerie', price_label: '99-299€' }),
      ]),
    )
    expect(OWNER_PLAN_CATALOG.every((plan) => plan.price_disclaimer === 'indicative_non_contractual')).toBe(true)
  })

  it('AC-01-01: resolves current subscription features from the static catalog', () => {
    expect(getOwnerPlanFeatures('trial')).toEqual(getOwnerPlanFeatures('discovery'))
    expect(getOwnerPlanFeatures('unknown-plan')).toEqual(getOwnerPlanFeatures('discovery'))
  })
})
