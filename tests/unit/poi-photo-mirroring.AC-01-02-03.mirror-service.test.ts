import sharp from 'sharp'

const mockPoiFindFirst = jest.fn()
const mockPoiFindMany = jest.fn()
const mockMirrorFindMany = jest.fn()
const mockMirrorUpsert = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findFirst: (...a: unknown[]) => mockPoiFindFirst(...a),
      findMany: (...a: unknown[]) => mockPoiFindMany(...a),
    },
    poiPhotoMirror: {
      findMany: (...a: unknown[]) => mockMirrorFindMany(...a),
      upsert: (...a: unknown[]) => mockMirrorUpsert(...a),
    },
  },
}))

import { mirrorPendingPoiPhotos, mirrorPoiPhotos, type MirrorDeps } from '@/features/poi-photos/services/mirror-poi-photos'

const SUPABASE = 'https://abcdefgh.supabase.co'
beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE })

async function jpeg(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#c08080' } }).jpeg().toBuffer()
}

function makeDeps(body: Buffer): MirrorDeps & { upload: jest.Mock; download: jest.Mock; revalidate: jest.Mock } {
  return {
    download: jest.fn(async () => ({ ok: true as const, body, contentType: 'image/jpeg' })),
    upload: jest.fn(async (path: string) => `${SUPABASE}/storage/v1/object/public/guide-photos/${path}`),
    revalidate: jest.fn(),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockMirrorFindMany.mockResolvedValue([])
  mockMirrorUpsert.mockResolvedValue({})
})

describe('063 — mirrorPoiPhotos', () => {
  it('AC-01-02: convertit en WebP ≤ 1600 px, envoie dans pois/<id>/ et enregistre la correspondance', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    const deps = makeDeps(await jpeg(3000, 2000))

    const report = await mirrorPoiPhotos('poi-1', deps)

    expect(report).toEqual({ mirrored: 1, skipped: 0, failed: 0 })
    const [path, body] = deps.upload.mock.calls[0] as [string, Buffer]
    expect(path).toMatch(/^pois\/poi-1\/[0-9a-f]{16}\.webp$/)
    const meta = await sharp(body).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(1600)
    expect(mockMirrorUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { poi_id_source_url: { poi_id: 'poi-1', source_url: 'https://site.fr/a.jpg' } },
      create: expect.objectContaining({ poi_id: 'poi-1', source_url: 'https://site.fr/a.jpg', width: 1600 }),
    }))
    expect(deps.revalidate).toHaveBeenCalledWith('poi-1')
  })

  it('AC-01-02: ne grossit pas une petite image', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    const deps = makeDeps(await jpeg(500, 500))
    await mirrorPoiPhotos('poi-1', deps)
    const meta = await sharp(deps.upload.mock.calls[0][1] as Buffer).metadata()
    expect(meta.width).toBe(500)
  })

  it('AC-01-03: ignore une photo déjà copiée, sans téléchargement ni revalidation', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    mockMirrorFindMany.mockResolvedValue([{ source_url: 'https://site.fr/a.jpg' }])
    const deps = makeDeps(await jpeg(10, 10))

    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 1, failed: 0 })
    expect(deps.download).not.toHaveBeenCalled()
    expect(deps.revalidate).not.toHaveBeenCalled()
  })

  it('BR-03: ne recopie jamais une URL MyStay ni un chemin relatif', async () => {
    mockPoiFindFirst.mockResolvedValue({
      id: 'poi-1',
      photos: [`${SUPABASE}/storage/v1/object/public/guide-photos/x.webp`, '/fallback/restaurant.webp'],
    })
    const deps = makeDeps(await jpeg(10, 10))
    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 2, failed: 0 })
    expect(deps.download).not.toHaveBeenCalled()
  })

  it('AC-02-03: compte un échec de téléchargement ou un contenu indécodable sans rien enregistrer', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg', 'https://site.fr/b.jpg'] })
    const deps = makeDeps(Buffer.from('pas une image'))
    deps.download.mockResolvedValueOnce({ ok: false, reason: 'NOT_IMAGE' })
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 2 })
    expect(mockMirrorUpsert).not.toHaveBeenCalled()
    expect(errorLog).toHaveBeenCalledWith('POI_PHOTO_MIRROR_FAILED', expect.objectContaining({ poiId: 'poi-1' }))
    errorLog.mockRestore()
  })

  it('compte un échec d’envoi Supabase', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/a.jpg'] })
    const deps = makeDeps(await jpeg(10, 10))
    deps.upload.mockResolvedValue(null)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 1 })
  })

  it('renvoie un rapport vide pour un POI introuvable ou non publié', async () => {
    mockPoiFindFirst.mockResolvedValue(null)
    await expect(mirrorPoiPhotos('absent', makeDeps(await jpeg(10, 10)))).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 0 })
  })
})

describe('063 — mirrorPendingPoiPhotos', () => {
  it('AC-01-04 / BR-06: s’arrête à la limite et ignore les photos déjà copiées', async () => {
    mockPoiFindMany.mockResolvedValue([
      { id: 'poi-1', photos: ['https://site.fr/1.jpg', 'https://site.fr/2.jpg'], photo_mirrors: [{ source_url: 'https://site.fr/1.jpg' }] },
      { id: 'poi-2', photos: ['https://site.fr/3.jpg', 'https://site.fr/4.jpg'], photo_mirrors: [] },
    ])
    mockPoiFindFirst.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === 'poi-1'
        ? { id: 'poi-1', photos: ['https://site.fr/1.jpg', 'https://site.fr/2.jpg'] }
        : { id: 'poi-2', photos: ['https://site.fr/3.jpg', 'https://site.fr/4.jpg'] })
    mockMirrorFindMany.mockImplementation(async ({ where }: { where: { poi_id: string } }) =>
      where.poi_id === 'poi-1' ? [{ source_url: 'https://site.fr/1.jpg' }] : [])
    const deps = makeDeps(await jpeg(10, 10))

    const report = await mirrorPendingPoiPhotos(2, deps)

    expect(report.mirrored).toBe(2)
    expect(deps.download).toHaveBeenCalledTimes(2)
    expect(mockPoiFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ discovery_status: 'PUBLISHED', deleted_at: null }),
      orderBy: { discovery_published_at: 'asc' },
    }))
  })

  // Revue finale (point 2) : les échecs permanents ne doivent pas bloquer la file.
  it('ne tente pas les photos en http (échec certain), sans les compter en échec', async () => {
    mockPoiFindMany.mockResolvedValue([
      { id: 'poi-1', photos: ['http://site.fr/old.jpg'], photo_mirrors: [] },
    ])
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['http://site.fr/old.jpg'] })
    const deps = makeDeps(await jpeg(10, 10))

    const report = await mirrorPendingPoiPhotos(40, deps)

    expect(deps.download).not.toHaveBeenCalled()
    expect(report.failed).toBe(0)
  })

  it('s’arrête à l’échéance de temps', async () => {
    mockPoiFindMany.mockResolvedValue([
      { id: 'poi-1', photos: ['https://site.fr/1.jpg'], photo_mirrors: [] },
    ])
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/1.jpg'] })
    const deps = makeDeps(await jpeg(10, 10))

    const report = await mirrorPendingPoiPhotos(40, deps, { deadline: Date.now() - 1 })

    expect(deps.download).not.toHaveBeenCalled()
    expect(report).toEqual({ mirrored: 0, skipped: 0, failed: 0 })
  })

  it('fait tourner l’ordre des POI pour que les mêmes échecs ne passent pas toujours devant', async () => {
    mockPoiFindMany.mockResolvedValue([
      { id: 'poi-1', photos: ['https://site.fr/1.jpg'], photo_mirrors: [] },
      { id: 'poi-2', photos: ['https://site.fr/2.jpg'], photo_mirrors: [] },
    ])
    mockPoiFindFirst.mockImplementation(async ({ where }: { where: { id: string } }) =>
      ({ id: where.id, photos: [where.id === 'poi-1' ? 'https://site.fr/1.jpg' : 'https://site.fr/2.jpg'] }))
    const deps = makeDeps(await jpeg(10, 10))
    const shuffle = jest.fn(<T,>(items: T[]) => [...items].reverse())

    await mirrorPendingPoiPhotos(1, { ...deps, shuffle })

    expect(shuffle).toHaveBeenCalled()
    expect(deps.download).toHaveBeenCalledWith('https://site.fr/2.jpg')
  })
})

describe('063 — protection mémoire au décodage', () => {
  it('refuse une image de plus de 40 millions de pixels sans rien enregistrer (revue finale, point 3)', async () => {
    mockPoiFindFirst.mockResolvedValue({ id: 'poi-1', photos: ['https://site.fr/geante.png'] })
    const huge = await sharp({ create: { width: 7000, height: 6000, channels: 3, background: '#ffffff' } }).png().toBuffer()
    const deps = makeDeps(huge)
    jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(mirrorPoiPhotos('poi-1', deps)).resolves.toEqual({ mirrored: 0, skipped: 0, failed: 1 })
    expect(deps.upload).not.toHaveBeenCalled()
    expect(mockMirrorUpsert).not.toHaveBeenCalled()
  })
})
