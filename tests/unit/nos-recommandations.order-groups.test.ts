import { orderGroupsByCategoryOrder } from '@/app/(public)/nos-recommandations/_components/order-groups'

type G = { categorySlug: string }

describe('orderGroupsByCategoryOrder', () => {
  it('ordonne les groupes selon category_order', () => {
    const groups: G[] = [
      { categorySlug: 'boulangerie' },
      { categorySlug: 'diner' },
      { categorySlug: 'rando' },
    ]
    const order = ['diner', 'boulangerie', 'rando']

    const result = orderGroupsByCategoryOrder(groups, order).map(g => g.categorySlug)

    expect(result).toEqual(['diner', 'boulangerie', 'rando'])
  })

  it('place les catégories absentes de category_order à la fin, dans leur ordre initial', () => {
    const groups: G[] = [
      { categorySlug: 'boulangerie' },
      { categorySlug: 'soin' }, // absent de l'ordre
      { categorySlug: 'diner' },
      { categorySlug: 'mobilite' }, // absent de l'ordre
    ]
    const order = ['diner', 'boulangerie']

    const result = orderGroupsByCategoryOrder(groups, order).map(g => g.categorySlug)

    expect(result).toEqual(['diner', 'boulangerie', 'soin', 'mobilite'])
  })

  it('retourne les groupes inchangés si category_order est vide', () => {
    const groups: G[] = [{ categorySlug: 'boulangerie' }, { categorySlug: 'diner' }]

    const result = orderGroupsByCategoryOrder(groups, []).map(g => g.categorySlug)

    expect(result).toEqual(['boulangerie', 'diner'])
  })
})
