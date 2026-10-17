import { findCommonsPhotos, isAcceptedLicense } from '@/features/poi-photos/services/wikimedia-commons'

const poi = { name: 'Cascade de Combe Noire', latitude: 45.78001, longitude: 6.72253, city: 'Les Contamines-Montjoie' }

function file(title: string, overrides: { license?: string; width?: number; mime?: string; coords?: { lat: number; lon: number } | null; description?: string } = {}) {
  return {
    title,
    ...(overrides.coords === null ? {} : { coordinates: [overrides.coords ?? { lat: 45.7801, lon: 6.7224 }] }),
    imageinfo: [{
      width: overrides.width ?? 3456,
      mime: overrides.mime ?? 'image/jpeg',
      thumburl: `https://upload.wikimedia.org/thumb/${encodeURIComponent(title)}/1600px.jpg`,
      descriptionurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      extmetadata: {
        Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:R%C3%A9mih">Rémih</a>' },
        LicenseShortName: { value: overrides.license ?? 'CC BY-SA 4.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' },
        ImageDescription: { value: overrides.description ?? '' },
      },
    }],
  }
}

function mockCommons(files: ReturnType<typeof file>[]) {
  global.fetch = jest.fn(async (url: string | URL) => {
    const params = new URL(String(url)).searchParams
    if (params.get('list') === 'search') return Response.json({ query: { search: files.map(item => ({ title: item.title })) } })
    return Response.json({ query: { pages: Object.fromEntries(files.map((item, index) => [String(index), item])) } })
  }) as unknown as typeof fetch
}

// Spec 101 US-02 — photos Wikimedia Commons sous licence libre, créditées.
describe('101 US-02 — findCommonsPhotos', () => {
  const originalFetch = global.fetch
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined))
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks() })

  it('AC-02-02 : licences libres acceptées, NC et ND refusées', () => {
    for (const license of ['CC BY-SA 4.0', 'CC BY 2.0', 'CC BY 3.0', 'CC0', 'Public domain']) expect(isAcceptedLicense(license)).toBe(true)
    for (const license of ['CC BY-NC 4.0', 'CC BY-NC-SA 3.0', 'CC BY-ND 2.0', 'All rights reserved', '']) expect(isAcceptedLicense(license)).toBe(false)
  })

  it('AC-02-01 / AC-02-04 : photo au nom exact, crédit auteur + licence + pages', async () => {
    mockCommons([file('File:Cascade de Combe Noire 01.jpg')])
    await expect(findCommonsPhotos(poi)).resolves.toEqual([{
      photo_url: 'https://upload.wikimedia.org/thumb/File%3ACascade%20de%20Combe%20Noire%2001.jpg/1600px.jpg',
      author: 'Rémih',
      license: 'CC BY-SA 4.0',
      license_url: 'https://creativecommons.org/licenses/by-sa/4.0',
      source_url: 'https://commons.wikimedia.org/wiki/File%3ACascade%20de%20Combe%20Noire%2001.jpg',
    }])
  })

  it('AC-02-01 / AC-02-02 : écarte licence NC, image trop petite, format non accepté, nom absent', async () => {
    mockCommons([
      file('File:Cascade de Combe Noire NC.jpg', { license: 'CC BY-NC 4.0' }),
      file('File:Cascade de Combe Noire petite.jpg', { width: 640 }),
      file('File:Cascade de Combe Noire.tif', { mime: 'image/tiff' }),
      file('File:Torrent du Bonnant.jpg'),
    ])
    await expect(findCommonsPhotos(poi)).resolves.toEqual([])
  })

  it('AC-02-03 : géolocalisée à plus de 5 km → écartée ; sans position, il faut citer la ville', async () => {
    mockCommons([
      file('File:Cascade de Combe Noire loin.jpg', { coords: { lat: 45.0, lon: 5.0 } }),
      file('File:Cascade de Combe Noire sans lieu.jpg', { coords: null }),
      file('File:Cascade de Combe Noire 02.jpg', { coords: null, description: 'Les Contamines-Montjoie, Haute-Savoie' }),
    ])
    const photos = await findCommonsPhotos(poi)
    expect(photos.map(photo => decodeURIComponent(photo.source_url).split('/').pop())).toEqual(['File:Cascade de Combe Noire 02.jpg'])
  })

  it('AC-02-01 : 5 photos au plus', async () => {
    mockCommons(Array.from({ length: 8 }, (_, index) => file(`File:Cascade de Combe Noire ${index}.jpg`)))
    await expect(findCommonsPhotos(poi)).resolves.toHaveLength(5)
  })

  it('Commons indisponible → aucune photo', async () => {
    global.fetch = jest.fn(async () => new Response('down', { status: 503 })) as unknown as typeof fetch
    await expect(findCommonsPhotos(poi)).resolves.toEqual([])
  })
})
