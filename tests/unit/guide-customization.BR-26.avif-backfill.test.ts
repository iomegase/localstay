import sharp from 'sharp'
import { convertStoredAvifPhotos, webpPathForStorageUrl } from '@/shared/lib/avif-to-webp-backfill'

const BASE = 'https://proj.supabase.co/storage/v1/object/public/guide-photos/'

describe('spec 012 BR-26 — backfill AVIF → WebP', () => {
  it('derives the bucket paths from a public storage URL', () => {
    expect(webpPathForStorageUrl(`${BASE}lodgings/abc/171.avif`)).toEqual({
      source: 'lodgings/abc/171.avif',
      target: 'lodgings/abc/171.webp',
    })
    expect(webpPathForStorageUrl('https://elsewhere.test/photo.avif')).toBeNull()
    expect(webpPathForStorageUrl(`${BASE}lodgings/abc/171.webp`)).toBeNull()
  })

  it('stores a WebP copy, updates the row URL and keeps the AVIF file', async () => {
    const avif = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#123456' } }).avif().toBuffer()
    const uploads: Array<{ path: string; body: Buffer }> = []
    const updates: Array<{ id: string; url: string }> = []

    const report = await convertStoredAvifPhotos(
      [
        { id: 'p1', url: `${BASE}lodgings/abc/1.avif` },
        { id: 'p2', url: 'https://elsewhere.test/2.avif' },
      ],
      {
        download: async () => avif,
        upload: async (path, body) => { uploads.push({ path, body }) },
        publicUrl: path => `${BASE}${path}`,
        updateUrl: async (id, url) => { updates.push({ id, url }) },
      },
      { apply: true },
    )

    expect(report).toEqual({ converted: 1, skipped: 1, failed: 0 })
    expect(uploads.map(u => u.path)).toEqual(['lodgings/abc/1.webp'])
    await expect(sharp(uploads[0].body).metadata()).resolves.toMatchObject({ format: 'webp', width: 2560 })
    expect(updates).toEqual([{ id: 'p1', url: `${BASE}lodgings/abc/1.webp` }])
  })

  it('writes nothing in dry-run mode', async () => {
    const upload = jest.fn()
    const updateUrl = jest.fn()
    const report = await convertStoredAvifPhotos(
      [{ id: 'p1', url: `${BASE}lodgings/abc/1.avif` }],
      { download: jest.fn(), upload, publicUrl: p => p, updateUrl },
      { apply: false },
    )
    expect(report).toEqual({ converted: 1, skipped: 0, failed: 0 })
    expect(upload).not.toHaveBeenCalled()
    expect(updateUrl).not.toHaveBeenCalled()
  })

  it('counts a failed photo and leaves its URL untouched', async () => {
    const updateUrl = jest.fn()
    const report = await convertStoredAvifPhotos(
      [{ id: 'p1', url: `${BASE}lodgings/abc/1.avif` }],
      { download: async () => { throw new Error('404') }, upload: jest.fn(), publicUrl: p => p, updateUrl },
      { apply: true },
    )
    expect(report).toEqual({ converted: 0, skipped: 0, failed: 1 })
    expect(updateUrl).not.toHaveBeenCalled()
  })
})
