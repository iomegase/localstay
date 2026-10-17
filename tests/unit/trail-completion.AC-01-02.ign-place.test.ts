import { findIgnPlace } from '@/features/trails-acquisition/services/ign-places'

const feature = (name: string, lon: number, lat: number) => ({ geometry: { coordinates: [lon, lat] }, properties: { toponym: name } })

// Spec 102 AC-01-02 — destination IGN par le nom exact, à 15 km du départ.
describe('102 AC-01-02 — findIgnPlace', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })
  const start: [number, number] = [6.7263, 45.8169]

  it('nom identique sans casse ni accents → position', async () => {
    global.fetch = jest.fn(async () => Response.json({ features: [feature("Lac d'Armancette", 6.75258, 45.81606)] })) as unknown as typeof fetch
    await expect(findIgnPlace("lac d'armancette", start)).resolves.toEqual({ name: "Lac d'Armancette", coord: [6.75258, 45.81606] })
  })

  it('« Lac de l’Etape » ne prend jamais la « Retenue de l’Étale » ; trop loin → null', async () => {
    global.fetch = jest.fn(async () => Response.json({ features: [feature("Retenue de l'Étale", 6.42707, 45.8734), feature("Lac de l'Etape", 6.0, 45.0)] })) as unknown as typeof fetch
    await expect(findIgnPlace("Lac de l'Etape", start)).resolves.toBeNull()
  })

  it('IGN indisponible → null', async () => {
    global.fetch = jest.fn(async () => new Response('down', { status: 503 })) as unknown as typeof fetch
    await expect(findIgnPlace('Mont Joly', start)).resolves.toBeNull()
  })
})
