import { trailPhotoCredits } from '@/features/trails-acquisition/lib/photo-credits'
import { createGeotrekPhotoFinder, geotrekPhotos } from '@/features/trails-acquisition/services/geotrek-photos'
import { enrichCandidatesWithTrailPhotos } from '@/features/trails-acquisition/services/camptocamp-photos'

const city = { latitude: 45.8228, longitude: 6.7272 }
const trek = (id: number, name: string, departure: [number, number], author: string | null = 'Teddy Bracard - CEN 74') => ({
  id, name, departure_geom: departure,
  attachments: [{ type: 'image', url: `https://geotrek.nature-haute-savoie.fr/media/${id}.jpg`, author, legend: 'Lac', license: null }, { type: 'document', url: 'https://x/doc.pdf' }],
})

describe('PO 2026-10-08 — photos Geotrek avec crédit d’auteur', () => {
  it('photos Geotrek : auteur crédité, page source, documents ignorés', () => {
    expect(geotrekPhotos(trek(149, "Balade au lac d'Armancette", [6.7357, 45.8230]))).toEqual([{
      url: 'https://geotrek.nature-haute-savoie.fr/media/149.jpg',
      source_url: 'https://rando.nature-haute-savoie.fr/trek/149',
      attribution: 'Teddy Bracard - CEN 74 — Geotrek Haute-Savoie',
      caption: 'Lac',
    }])
    expect(geotrekPhotos(trek(1, 'Sans auteur', [6.7, 45.8], null))[0]!.attribution).toBe('Geotrek Haute-Savoie')
  })

  it('correspondance par nom (« Balade au lac d’Armancette » ↔ « Lac d’Armancette »), une seule requête par run, distance ≤ 10 km', async () => {
    const fetcher = jest.fn(async () => ({ results: [trek(2, "Balade au lac d'Armancette", [6.0, 45.0]), trek(149, "Balade au lac d'Armancette", [6.7357, 45.8230])] }))
    const find = createGeotrekPhotoFinder(city, fetcher)
    expect((await find({ title: "Lac d'Armancette" })).map(photo => photo.url)).toEqual(['https://geotrek.nature-haute-savoie.fr/media/149.jpg'])
    expect(await find({ title: 'Boucle de Miage' })).toEqual([])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(String((fetcher.mock.calls[0] as unknown as [string])[0])).toMatch(/^https:\/\/geotrek\.nature-haute-savoie\.fr\/api\/v2\/trek\/\?format=json&language=fr&in_bbox=/)
  })

  it('Geotrek d’abord, Camptocamp ensuite pour les randonnées restées sans photo', async () => {
    const geotrek = jest.fn(async (candidate: { title: string }) => (candidate.title === 'A' ? [{ url: 'https://g/a.jpg', source_url: 'https://g', attribution: 'G' }] : []))
    const camptocamp = jest.fn(async () => [{ url: 'https://c/b.jpg', source_url: 'https://c', attribution: 'C' }])
    const a = { title: 'A', primary_source_type: 'overpass', raw_payload: {} as unknown }
    const b = { title: 'B', primary_source_type: 'overpass', raw_payload: {} as unknown }
    await enrichCandidatesWithTrailPhotos([a, b], city, undefined, [geotrek, camptocamp])
    expect(camptocamp).toHaveBeenCalledTimes(1)
    expect((a.raw_payload as { acquired_photos: Array<{ attribution: string }> }).acquired_photos[0]!.attribution).toBe('G')
    expect((b.raw_payload as { acquired_photos: Array<{ attribution: string }> }).acquired_photos[0]!.attribution).toBe('C')
  })

  it('crédits publiés : sources des photos seulement, sans doublon, entités HTML décodées', () => {
    expect(trailPhotoCredits([
      { type: 'overpass', attribution: 'OpenStreetMap contributors', used_for: ['geometry'] },
      { type: 'official_website', url: 'https://www.combloux.com/itineraires/x/', attribution: 'vue chaîne des Fiz &copy; OT Combloux_Marine Martin', used_for: ['photos'] },
      { type: 'camptocamp', url: 'https://www.camptocamp.org/waypoints/11', attribution: 'Alice — Camptocamp.org', used_for: ['photos'] },
      { type: 'camptocamp', url: 'https://www.camptocamp.org/waypoints/12', attribution: 'Alice — Camptocamp.org', used_for: ['photos'] },
      { type: 'x', url: 'javascript:alert(1)', attribution: 'Sans lien', used_for: ['photos'] },
    ])).toEqual([
      { attribution: 'vue chaîne des Fiz © OT Combloux_Marine Martin', url: 'https://www.combloux.com/itineraires/x/' },
      { attribution: 'Alice — Camptocamp.org', url: 'https://www.camptocamp.org/waypoints/11' },
      { attribution: 'Sans lien', url: null },
    ])
    expect(trailPhotoCredits(null)).toEqual([])
  })
})
