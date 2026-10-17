import { camptocampPoint, camptocampRouteFacts, completedTitle } from '@/features/trails-acquisition/lib/camptocamp-route'

// Spec 102 AC-01-01 — faits d'un itinéraire Camptocamp (route 639463 « Depuis Bionnassay »).
const route = {
  locales: [{ lang: 'fr', title: 'Depuis Bionnassay', title_prefix: 'Refuge de Tête Rousse' }],
  route_length: 17000,
  height_diff_up: 1760,
  associations: {
    waypoints: [
      { waypoint_type: 'hut', locales: [{ lang: 'fr', title: 'Refuge de Tête Rousse' }], geometry: { geom: '{"type": "Point", "coordinates": [758903.395277, 5757133.472329]}' } },
      { waypoint_type: 'access', locales: [{ lang: 'fr', title: 'Bionnassay - le Crozat' }], geometry: { geom: '{"type": "Point", "coordinates": [752581.65139941, 5759052.480552947]}' } },
    ],
  },
}

describe('102 AC-01-01 — Camptocamp', () => {
  it('titre complet, accès, destination, longueur et dénivelé', () => {
    const facts = camptocampRouteFacts(route)
    expect(facts.title).toBe('Refuge de Tête Rousse : Depuis Bionnassay')
    expect(facts.lengthKm).toBe(17)
    expect(facts.heightDiffUp).toBe(1760)
    expect(facts.destination?.name).toBe('Refuge de Tête Rousse')
    expect(facts.destination?.coord[0]).toBeCloseTo(6.8174, 3)
    expect(facts.destination?.coord[1]).toBeCloseTo(45.8549, 3)
    expect(facts.access?.[0]).toBeCloseTo(6.7606, 3)
  })

  it('complète le titre une seule fois, sans remplacer un titre différent', () => {
    const facts = camptocampRouteFacts(route)
    expect(completedTitle('Depuis Bionnassay', facts)).toBe('Refuge de Tête Rousse : Depuis Bionnassay')
    expect(completedTitle('Refuge de Tête Rousse : Depuis Bionnassay', facts)).toBe('Refuge de Tête Rousse : Depuis Bionnassay')
    expect(completedTitle('Ma randonnée renommée', facts)).toBe('Ma randonnée renommée')
  })

  it('point invalide ou absent → null ; longueur nulle ignorée', () => {
    expect(camptocampPoint(null)).toBeNull()
    expect(camptocampPoint('pas du json')).toBeNull()
    expect(camptocampPoint('{"type":"LineString","coordinates":[[0,0],[1,1]]}')).toBeNull()
    expect(camptocampRouteFacts({ locales: [{ lang: 'fr', title: 'X' }], route_length: 0 })).toMatchObject({ title: 'X', lengthKm: null, destination: null, access: null })
  })
})
