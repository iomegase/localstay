import { fetchOfficialWebsiteTrailCandidates } from '@/features/trails-acquisition/services/official-website'

const page = 'https://www.combloux.com/itineraires/graniteurs/'
const attachment = 'https://static.apidae-tourisme.com/trace.gpx'
const html = `<h1>Sentier des Graniteurs</h1><a href="${attachment}">GPX</a>`
const segment = '<trkseg><trkpt lat="45.9" lon="6.64"/><trkpt lat="45.901" lon="6.641"/></trkseg>'
const originalFetch = global.fetch
const fetchMock = jest.fn()
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset() })
afterEach(() => { global.fetch = originalFetch })

it('retrieves the official linked GPX and records its geometry, start and attribution', async () => {
  fetchMock.mockResolvedValueOnce(new Response(html)).mockResolvedValueOnce(new Response(`<gpx><trk>${segment}</trk></gpx>`))
  const [candidate] = await fetchOfficialWebsiteTrailCandidates(page, new AbortController().signal)
  expect(candidate.geometry_status).toBe('valid')
  expect(candidate.start_latitude).toBe(45.9)
  expect(candidate.geometry_geojson).toEqual({ type: 'LineString', coordinates: [[6.64, 45.9], [6.641, 45.901]] })
  expect(candidate.source_refs).toContainEqual({ type: 'gpx', url: attachment, attribution: 'www.combloux.com', used_for: ['geometry'] })
})
it('preserves disconnected track segments', async () => {
  fetchMock.mockResolvedValueOnce(new Response(html)).mockResolvedValueOnce(new Response(`<gpx><trk>${segment}${segment}</trk></gpx>`))
  const [candidate] = await fetchOfficialWebsiteTrailCandidates(page, new AbortController().signal)
  expect(candidate.geometry_geojson).toMatchObject({ type: 'MultiLineString', coordinates: [expect.any(Array), expect.any(Array)] })
})
it('retains discovered content when the linked GPX fails', async () => {
  fetchMock.mockResolvedValueOnce(new Response(html)).mockResolvedValueOnce(new Response('Unavailable', { status: 503 }))
  const received = jest.fn()
  await expect(fetchOfficialWebsiteTrailCandidates(page, new AbortController().signal, received)).rejects.toThrow('GPX HTTP 503')
  expect(received).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sentier des Graniteurs' }))
})
it('does not follow an arbitrary third-party GPX host', async () => {
  fetchMock.mockResolvedValueOnce(new Response(html.replace(attachment, 'https://127.0.0.1/trace.gpx')))
  await fetchOfficialWebsiteTrailCandidates(page, new AbortController().signal)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
it('does not attach one trace to multiple trails on a listing page', async () => {
  fetchMock.mockResolvedValueOnce(new Response(html + '<h2>Randonnée du Mont Joly</h2>'))
  const candidates = await fetchOfficialWebsiteTrailCandidates(page, new AbortController().signal)
  expect(candidates).toHaveLength(2)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
it('rejects invalid coordinates instead of reporting a valid trace', async () => {
  fetchMock.mockResolvedValueOnce(new Response(html)).mockResolvedValueOnce(new Response('<gpx><trkpt lat="999" lon="6"/></gpx>'))
  await expect(fetchOfficialWebsiteTrailCandidates(page, new AbortController().signal)).rejects.toThrow('GPX invalide')
})
