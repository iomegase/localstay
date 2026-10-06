import { groupPoisBySubcategory } from '@/features/public-discovery/lib/subcategory-groups'

// Spec 065 AC-02-01 / AC-02-03 : sections par sous-catégorie, ordre de la taxonomie.
type Item = { slug: string; subcategory: { name: string; slug: string; sort_order: number } | null }

const ski = { name: 'Location de ski', slug: 'location-de-ski', sort_order: 3 }
const boutiques = { name: 'Boutiques locales', slug: 'boutiques-locales', sort_order: 0 }
const produits = { name: 'Produits régionaux', slug: 'produits-regionaux', sort_order: 2 }

function item(slug: string, subcategory: Item['subcategory']): Item {
  return { slug, subcategory }
}

describe('065 AC-02 — regroupement par sous-catégorie', () => {
  it('ordonne les groupes selon sort_order et garde l’ordre d’entrée (distance) dans chaque groupe', () => {
    const groups = groupPoisBySubcategory([
      item('blanc-sport', ski),
      item('epicerie', produits),
      item('boutique-a', boutiques),
      item('loueur-2', ski),
      item('boutique-b', boutiques),
    ])

    expect(groups.map(group => group.subcategory?.slug ?? null)).toEqual([
      'boutiques-locales',
      'produits-regionaux',
      'location-de-ski',
    ])
    expect(groups[0]!.items.map(entry => entry.slug)).toEqual(['boutique-a', 'boutique-b'])
    expect(groups[2]!.items.map(entry => entry.slug)).toEqual(['blanc-sport', 'loueur-2'])
  })

  it('AC-02-03 : place les POI sans sous-catégorie dans un dernier groupe', () => {
    const groups = groupPoisBySubcategory([
      item('sans-sous-categorie', null),
      item('blanc-sport', ski),
    ])

    expect(groups.map(group => group.subcategory?.slug ?? null)).toEqual(['location-de-ski', null])
  })

  it('départage deux sous-catégories de même ordre par leur nom français', () => {
    const groups = groupPoisBySubcategory([
      item('b', { name: 'Souvenirs', slug: 'souvenirs', sort_order: 1 }),
      item('a', { name: 'Épicerie', slug: 'epicerie', sort_order: 1 }),
    ])

    expect(groups.map(group => group.subcategory?.slug)).toEqual(['epicerie', 'souvenirs'])
  })

  it('renvoie une liste vide sans POI', () => {
    expect(groupPoisBySubcategory([])).toEqual([])
  })
})
