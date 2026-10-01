import { extractTrailPhotos } from '@/features/trails-acquisition/lib/photos'
import { extractOfficialWebsiteTrailPhotos } from '@/features/trails-acquisition/services/official-website'
import { mergeDuplicateCandidates } from '@/features/trails-acquisition/lib/dedup'

const photo = { url: 'https://static.apidae-tourisme.com/photo.jpg', source_url: 'https://www.combloux.com/itineraires/test/', attribution: 'Photographe OT', caption: 'Croisse Baulet' }
it('keeps every Camptocamp photo beyond the old eight-image cap', () => {
  const photos = extractTrailPhotos({ document_id: 123, associations: { images: Array.from({ length: 12 }, (_, i) => ({ filename: `${i}.jpg` })) } })
  expect(photos).toHaveLength(12)
  expect(photos[0].source_url).toBe('https://www.camptocamp.org/routes/123')
})
it('reads recovered photos independently of the primary source, deduplicates and rejects unsafe URLs', () => {
  expect(extractTrailPhotos({ acquired_photos: [photo, photo, { ...photo, url: 'javascript:alert(1)' }] })).toEqual([photo])
})
it('extracts the Combloux gallery without restaurant recommendation images', () => {
  const html = '<button data-hc-lightbox="wpet-gallery" data-src="https://cdn.iris-etourism.io/trail.webp" data-caption="Vue © OT"></button><img src="https://cdn.iris-etourism.io/restaurant.webp">'
  const photos = extractOfficialWebsiteTrailPhotos(html, photo.source_url)
  expect(photos).toHaveLength(1)
  expect(photos[0]).toMatchObject({ url: 'https://cdn.iris-etourism.io/trail.webp', attribution: 'Vue © OT' })
})
it('extracts every official gallery image with credits and excludes PDF documents', () => {
  const gallery = Array.from({ length: 10 }, (_, i) => ({ type: '03.01.01', URL: `https://static.apidae-tourisme.com/${i}.jpg`, copyright: 'Auteur', caption: { fr: 'Paysage' } }))
  const html = `<script>const HwSheet = ${JSON.stringify({ gallery: [...gallery, { type: '03.01.02', URL: 'https://example.com/map.pdf' }] })};</script>`
  const photos = extractOfficialWebsiteTrailPhotos(html, photo.source_url)
  expect(photos).toHaveLength(10)
  expect(photos[0]).toMatchObject({ attribution: 'Auteur', caption: 'Paysage' })
})
it('preserves photos from a secondary source when merging a geometry-first candidate', () => {
  const common = { title: 'Grand Croisse Baulet', description: null, source_refs: [] }
  const [merged] = mergeDuplicateCandidates([
    { ...common, primary_source_type: 'overpass', raw_payload: { id: 12 } },
    { ...common, primary_source_type: 'official_website', raw_payload: { acquired_photos: [photo] } },
  ])
  expect(extractTrailPhotos(merged.raw_payload)).toEqual([photo])
  expect(merged.raw_payload).toMatchObject({ id: 12 })
})
