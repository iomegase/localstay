import { mapTrailCandidate } from '@/features/trails-acquisition/queries/runs'

// Spec 019 (PO 2026-10-18) — la liste des candidats montre les valeurs actuelles de la fiche publiée.
const base = {
  id: 'cand-1',
  title: 'Refuge de Miage : En boucle depuis la Gruvaz',
  description: null,
  primary_source_type: 'camptocamp',
  source_refs: [],
  difficulty: 'easy',
  distance_km: null,
  elevation_gain_m: 500,
  estimated_duration_min: null,
  data_quality_status: 'needs_review',
  start_label: null,
  start_latitude: 45.84,
  start_longitude: 6.74,
  geometry_status: 'missing',
  elevation_status: 'valid',
  duplicate_poi_ids: [],
  review_status: 'published',
  published_poi_id: 'poi-1',
  trail_detail_id: 'td-1',
}
const detail = {
  deleted_at: null,
  difficulty: 'easy',
  distance_km: 9.3,
  elevation_gain_m: 500,
  estimated_duration_min: 240,
  geometry_geojson: { type: 'LineString', coordinates: [[6.74, 45.84], [6.75, 45.85]] },
}

describe('019 — valeurs de la fiche publiée dans la liste des candidats', () => {
  it('reprend distance, durée et tracé complétés sur la fiche', () => {
    const dto = mapTrailCandidate({ ...base, trail_detail: detail })
    expect(dto.distance_km).toBe(9.3)
    expect(dto.estimated_duration_min).toBe(240)
    expect(dto.elevation_gain_m).toBe(500)
    expect(dto.geometry_status).toBe('valid')
  })

  it('garde un tracé calculé « needs_review » tel quel', () => {
    const dto = mapTrailCandidate({ ...base, geometry_status: 'needs_review', trail_detail: detail })
    expect(dto.geometry_status).toBe('needs_review')
  })

  it('ignore la fiche tant que la randonnée n’est pas publiée, ou si la fiche est supprimée', () => {
    expect(mapTrailCandidate({ ...base, review_status: 'needs_review', trail_detail: detail }).distance_km).toBeNull()
    expect(mapTrailCandidate({ ...base, trail_detail: { ...detail, deleted_at: new Date() } }).distance_km).toBeNull()
    expect(mapTrailCandidate({ ...base, trail_detail: { ...detail, deleted_at: new Date() } }).geometry_status).toBe('missing')
  })
})
