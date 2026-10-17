import { filterByDrivingTime, MAX_DRIVING_SECONDS } from '@/features/poi-acquisition/lib/driving-range'

const center = { latitude: 45.8214, longitude: 6.7272 }
const place = (id: string, location: { latitude: number; longitude: number } | null = { latitude: 45.8, longitude: 6.7 }) => (
  { google_place_id: id, location }
)

// Spec 100 — lieux à plus de 20 min en voiture écartés avant traitement.
describe('100 — filterByDrivingTime', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined))
  afterEach(() => jest.restoreAllMocks())

  it('BR-01 : le seuil est de 20 min', () => {
    expect(MAX_DRIVING_SECONDS).toBe(1200)
  })

  it('AC-01-01 : écarte au-delà de 20 min, garde 20 min pile et en dessous', async () => {
    const fetcher = jest.fn(async () => ({ village: 240, limite: 1200, bourg: 7200 }))
    const result = await filterByDrivingTime([place('village'), place('limite'), place('bourg')], center, fetcher)

    expect(result.kept.map(candidate => candidate.google_place_id)).toEqual(['village', 'limite'])
    expect(result.skippedTooFarByRoad).toBe(1)
    expect(fetcher).toHaveBeenCalledWith(center, [
      { id: 'village', latitude: 45.8, longitude: 6.7 },
      { id: 'limite', latitude: 45.8, longitude: 6.7 },
      { id: 'bourg', latitude: 45.8, longitude: 6.7 },
    ])
  })

  it('AC-01-03 : garde un lieu sans itinéraire routier ou sans position', async () => {
    const fetcher = jest.fn(async () => ({ refuge: null }))
    const result = await filterByDrivingTime([place('refuge'), place('sans-position', null)], center, fetcher)

    expect(result.kept).toHaveLength(2)
    expect(result.skippedTooFarByRoad).toBe(0)
    expect(fetcher.mock.calls[0][1]).toEqual([{ id: 'refuge', latitude: 45.8, longitude: 6.7 }])
  })

  it('AC-01-03 : sans aucune position, Mapbox n’est pas appelé', async () => {
    const fetcher = jest.fn()
    const result = await filterByDrivingTime([place('a', null)], center, fetcher)
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.kept).toHaveLength(1)
  })

  it('AC-01-04 : Mapbox indisponible → tous les lieux conservés, avertissement', async () => {
    const result = await filterByDrivingTime([place('a'), place('b')], center, async () => { throw new Error('MAPBOX_MATRIX_HTTP_503') })
    expect(result).toEqual({ kept: [place('a'), place('b')], skippedTooFarByRoad: 0 })
    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})
