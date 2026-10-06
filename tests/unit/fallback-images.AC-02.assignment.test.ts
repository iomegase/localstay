import { fallbackPool, planFallbackAssignments } from '@/features/fallback-images/lib/assignment'

// Spec 070 US-02 — attribution des images de remplacement.
const at = (day: number) => new Date(`2026-10-0${day}T00:00:00.000Z`)

const images = [
  { id: 'ski-1', category_id: 'shop', subcategory_id: 'ski', created_at: at(1) },
  { id: 'ski-2', category_id: 'shop', subcategory_id: 'ski', created_at: at(2) },
  { id: 'shop-1', category_id: 'shop', subcategory_id: null, created_at: at(1) },
  { id: 'shop-2', category_id: 'shop', subcategory_id: null, created_at: at(2) },
  { id: 'diner-1', category_id: 'diner', subcategory_id: null, created_at: at(1) },
]

function poi(id: string, overrides: Partial<{ city_id: string; category_id: string; subcategory_id: string | null; has_photo: boolean; fallback_image_id: string | null }> = {}) {
  return { id, city_id: 'sg', category_id: 'shop', subcategory_id: 'ski', has_photo: false, fallback_image_id: null, ...overrides }
}

describe('070 AC-02-01 — réserve d’images', () => {
  it('prend la sous-catégorie quand elle a des images', () => {
    expect(fallbackPool(poi('a'), images).map(image => image.id)).toEqual(['ski-1', 'ski-2'])
  })

  it('retombe sur les images de la catégorie seule (BR-01)', () => {
    expect(fallbackPool(poi('a', { subcategory_id: 'boutiques' }), images).map(image => image.id)).toEqual(['shop-1', 'shop-2'])
    expect(fallbackPool(poi('a', { subcategory_id: null }), images).map(image => image.id)).toEqual(['shop-1', 'shop-2'])
  })

  it('aucune image disponible → réserve vide', () => {
    expect(fallbackPool(poi('a', { category_id: 'culture', subcategory_id: null }), images)).toEqual([])
  })
})

describe('070 AC-02-01 / AC-02-02 — choix sans doublon', () => {
  it('donne une image différente à chaque lieu de la ville tant qu’il y en a assez', () => {
    const plan = planFallbackAssignments([poi('a'), poi('b')], images, [])
    expect(plan).toEqual([
      { poi_id: 'a', fallback_image_id: 'ski-1' },
      { poi_id: 'b', fallback_image_id: 'ski-2' },
    ])
  })

  it('au-delà, réutilise la moins utilisée (égalité : la plus ancienne)', () => {
    const plan = planFallbackAssignments([poi('a'), poi('b'), poi('c')], images, [])
    expect(plan.map(change => change.fallback_image_id)).toEqual(['ski-1', 'ski-2', 'ski-1'])
  })

  it('tient compte des images déjà utilisées par les autres lieux de la ville', () => {
    const others = [poi('x', { fallback_image_id: 'ski-1' })]
    expect(planFallbackAssignments([poi('a')], images, others)).toEqual([{ poi_id: 'a', fallback_image_id: 'ski-2' }])
  })

  it('BR-03 : une autre ville ne compte pas', () => {
    const others = [poi('x', { city_id: 'combloux', fallback_image_id: 'ski-1' })]
    expect(planFallbackAssignments([poi('a')], images, others)).toEqual([{ poi_id: 'a', fallback_image_id: 'ski-1' }])
  })
})

describe('070 AC-02-03 / AC-02-04 / AC-02-05 — stabilité et recalcul', () => {
  it('AC-02-03 : une attribution valide est conservée (aucun changement)', () => {
    expect(planFallbackAssignments([poi('a', { fallback_image_id: 'ski-2' })], images, [])).toEqual([])
  })

  it('AC-02-04 : image retirée ou reclassée → nouvelle image', () => {
    expect(planFallbackAssignments([poi('a', { fallback_image_id: 'image-retiree' })], images, [])).toEqual([
      { poi_id: 'a', fallback_image_id: 'ski-1' },
    ])
  })

  it('AC-02-04 : lieu passé dans une autre catégorie → nouvelle image', () => {
    expect(planFallbackAssignments([poi('a', { category_id: 'diner', subcategory_id: null, fallback_image_id: 'ski-1' })], images, [])).toEqual([
      { poi_id: 'a', fallback_image_id: 'diner-1' },
    ])
  })

  it('AC-02-04 : des images de sous-catégorie arrivées remplacent l’image de catégorie', () => {
    expect(planFallbackAssignments([poi('a', { fallback_image_id: 'shop-1' })], images, [])).toEqual([
      { poi_id: 'a', fallback_image_id: 'ski-1' },
    ])
  })

  it('AC-02-05 : un lieu avec une vraie photo perd son image de remplacement', () => {
    expect(planFallbackAssignments([poi('a', { has_photo: true, fallback_image_id: 'ski-1' })], images, [])).toEqual([
      { poi_id: 'a', fallback_image_id: null },
    ])
    expect(planFallbackAssignments([poi('b', { has_photo: true })], images, [])).toEqual([])
  })

  it('aucune image disponible et aucune attribution → rien à faire', () => {
    expect(planFallbackAssignments([poi('a', { category_id: 'culture', subcategory_id: null })], images, [])).toEqual([])
  })
})
