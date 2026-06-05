import { refineTrailGeometry } from '@/features/trails-acquisition/services/refine-geometry'

const lineString = (coords: Array<[number, number]>) => ({ type: 'LineString', coordinates: coords })

// ~2 km roughly north between two points
const sparseInput = lineString([[6.70, 45.80], [6.70, 45.818]])

function orsResponse(coords: Array<[number, number]>) {
  return {
    ok: true,
    json: async () => ({ features: [{ geometry: { type: 'LineString', coordinates: coords } }] }),
  }
}

describe('refineTrailGeometry (ORS foot-hiking snap/densify)', () => {
  const realFetch = global.fetch
  const realKey = process.env.ORS_API_KEY

  afterEach(() => {
    global.fetch = realFetch
    if (realKey === undefined) delete process.env.ORS_API_KEY
    else process.env.ORS_API_KEY = realKey
    jest.restoreAllMocks()
  })

  it('returns null when ORS_API_KEY is absent (no call)', async () => {
    delete process.env.ORS_API_KEY
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    await expect(refineTrailGeometry(sparseInput)).resolves.toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns null for geometry with fewer than 2 points', async () => {
    process.env.ORS_API_KEY = 'k'
    await expect(refineTrailGeometry(lineString([[6.70, 45.80]]))).resolves.toBeNull()
  })

  it('returns a denser LineString + ors_match provenance on success', async () => {
    process.env.ORS_API_KEY = 'k'
    // denser route of ~similar length (10 points along the same ~2km axis)
    const dense: Array<[number, number]> = []
    for (let i = 0; i <= 9; i += 1) dense.push([6.70, 45.80 + i * 0.002])
    global.fetch = jest.fn().mockResolvedValue(orsResponse(dense)) as unknown as typeof fetch

    const result = await refineTrailGeometry(sparseInput)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('LineString')
    expect(result!.geometry.coordinates.length).toBeGreaterThan(2)
    expect(result!.source_ref.type).toBe('ors_match')
    expect(result!.source_ref.used_for).toContain('geometry')

    // calls the foot-hiking geojson endpoint
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(url).toMatch(/foot-hiking/)
  })

  it('returns null when ORS responds with an error status', async () => {
    process.env.ORS_API_KEY = 'k'
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }) as unknown as typeof fetch
    await expect(refineTrailGeometry(sparseInput)).resolves.toBeNull()
  })

  it('rejects a re-route that deviates wildly in length (>40%)', async () => {
    process.env.ORS_API_KEY = 'k'
    // ~12 km route — way longer than the ~2km original → untrustworthy
    const wild: Array<[number, number]> = []
    for (let i = 0; i <= 12; i += 1) wild.push([6.70, 45.80 + i * 0.009])
    global.fetch = jest.fn().mockResolvedValue(orsResponse(wild)) as unknown as typeof fetch
    await expect(refineTrailGeometry(sparseInput)).resolves.toBeNull()
  })
})
