import { filterByDrivingTime, isMountainPlace, MAX_DRIVING_SECONDS, OFF_ROAD_METERS } from '@/features/poi-acquisition/lib/driving-range'

const center = { latitude: 45.8214, longitude: 6.7272 }
const place = (id: string, name = id, location: { latitude: number; longitude: number } | null = { latitude: 45.8, longitude: 6.7 }) => (
  { google_place_id: id, name, location }
)
const road = (seconds: number | null, roadDistanceMeters: number | null = 5) => ({ seconds, roadDistanceMeters })

// Spec 100 — lieux à plus de 20 min en voiture écartés avant traitement.
describe('100 — filterByDrivingTime', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined))
  afterEach(() => jest.restoreAllMocks())

  it('BR-01 / BR-05 : seuils de 20 min et de 150 m', () => {
    expect(MAX_DRIVING_SECONDS).toBe(1200)
    expect(OFF_ROAD_METERS).toBe(150)
  })

  it('AC-01-01 : écarte au-delà de 20 min, garde 20 min pile et en dessous', async () => {
    const fetcher = jest.fn(async () => ({ village: road(240), limite: road(1200), bourg: road(7200) }))
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
    const fetcher = jest.fn(async () => ({ isole: road(null, null) }))
    const result = await filterByDrivingTime([place('isole'), place('sans-position', 'sans-position', null)], center, fetcher)

    expect(result.kept).toHaveLength(2)
    expect(result.skippedTooFarByRoad).toBe(0)
    expect(fetcher.mock.calls[0][1]).toEqual([{ id: 'isole', latitude: 45.8, longitude: 6.7 }])
  })

  it('AC-01-03 : sans aucune position, Mapbox n’est pas appelé', async () => {
    const fetcher = jest.fn()
    const result = await filterByDrivingTime([place('a', 'a', null)], center, fetcher)
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.kept).toHaveLength(1)
  })

  it('AC-01-04 : Mapbox indisponible → tous les lieux conservés, avertissement', async () => {
    const result = await filterByDrivingTime([place('a'), place('b')], center, async () => { throw new Error('MAPBOX_MATRIX_HTTP_503') })
    expect(result).toEqual({ kept: [place('a'), place('b')], skippedTooFarByRoad: 0 })
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('AC-01-05 : un refuge ou un lieu hors route à plus de 20 min est conservé', async () => {
    const fetcher = jest.fn(async () => ({
      'mont-joly': road(2335, 201),
      alpage: road(3000, 20),
      'hors-route': road(3000, 400),
      bourg: road(6868, 10),
    }))
    const result = await filterByDrivingTime([
      place('mont-joly', 'Refuge du Mont-Joly'),
      place('alpage', "L'Alpage des Besöens"),
      place('hors-route', 'Le Panoramique'),
      place('bourg', "L'ORIGINE"),
    ], center, fetcher)

    expect(result.kept.map(candidate => candidate.google_place_id)).toEqual(['mont-joly', 'alpage', 'hors-route'])
    expect(result.skippedTooFarByRoad).toBe(1)
  })

  it('BR-05 : reconnaissance par le nom (refuge, alpage, buvette, cabane) ou à plus de 150 m d’une route', () => {
    expect(isMountainPlace('Buvette du Col', road(3000))).toBe(true)
    expect(isMountainPlace('Cabane des Pêcheurs', road(3000))).toBe(true)
    expect(isMountainPlace('Café de la Gare', road(3000, 150))).toBe(false)
    expect(isMountainPlace('Café de la Gare', road(3000, 151))).toBe(true)
    expect(isMountainPlace('Refugeville Bar', road(3000))).toBe(false)
  })
})
