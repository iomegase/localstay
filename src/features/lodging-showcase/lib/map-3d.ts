import type mapboxgl from 'mapbox-gl'

/** Inclinaison des cartes de la fiche logement (PO 2026-10-07 : vue en perspective). */
export const LODGING_MAP_PITCH = 55

/** Bâtiments en relief (tuiles Mapbox Streets), sous les libellés pour qu'ils restent lisibles. */
export function addBuildings3d(map: mapboxgl.Map): void {
  const labelLayerId = map.getStyle()?.layers?.find(
    layer => layer.type === 'symbol' && layer.layout?.['text-field'] !== undefined,
  )?.id
  map.addLayer(
    {
      id: 'lodging-3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#e2e5ea',
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
        'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
        'fill-extrusion-opacity': 0.75,
      },
    },
    labelLayerId,
  )
}
