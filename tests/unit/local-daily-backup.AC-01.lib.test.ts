import { dumpFileName, dumpDate, expiredDumps, planStorageDownloads } from '../../scripts/backup/lib'

// Spec 081 — logique de la sauvegarde locale.
describe('081 AC-01-01 — nom des dumps', () => {
  it('mystay-AAAA-MM-JJ-HHMM.dump (heure locale) et relecture de la date', () => {
    const date = new Date(2026, 9, 6, 3, 5)
    expect(dumpFileName(date)).toBe('mystay-2026-10-06-0305.dump')
    expect(dumpDate('mystay-2026-10-06-0305.dump')?.getTime()).toBe(date.getTime())
    expect(dumpDate('notes.txt')).toBeNull()
  })
})

describe('081 AC-01-03 — rétention 30 jours', () => {
  const now = new Date(2026, 9, 31, 3, 0)
  it('supprime les dumps de plus de 30 jours, ignore les autres fichiers', () => {
    const files = ['mystay-2026-09-01-0300.dump', 'mystay-2026-10-01-0300.dump', 'mystay-2026-10-30-0300.dump', 'README.txt']
    expect(expiredDumps(files, now, 30)).toEqual(['mystay-2026-09-01-0300.dump'])
  })

  it('ne supprime jamais le dump le plus récent', () => {
    expect(expiredDumps(['mystay-2026-01-01-0300.dump', 'mystay-2026-02-01-0300.dump'], now, 30)).toEqual(['mystay-2026-01-01-0300.dump'])
    expect(expiredDumps(['mystay-2026-01-01-0300.dump'], now, 30)).toEqual([])
  })
})

describe('081 AC-01-02 — copie incrémentale du stockage', () => {
  it('ne télécharge que les fichiers nouveaux ou modifiés', () => {
    const remote = [
      { bucket: 'guide-photos', path: 'pois/a.webp', size: 10, updated_at: '2026-10-06T10:00:00Z' },
      { bucket: 'guide-photos', path: 'pois/b.webp', size: 20, updated_at: '2026-10-06T10:00:00Z' },
      { bucket: 'qr-codes', path: 'c.png', size: 5, updated_at: '2026-10-06T11:00:00Z' },
    ]
    const manifest = {
      'guide-photos/pois/a.webp': { size: 10, updated_at: '2026-10-06T10:00:00Z' },
      'guide-photos/pois/b.webp': { size: 19, updated_at: '2026-10-05T10:00:00Z' },
      'guide-photos/old.webp': { size: 1, updated_at: '2026-01-01T00:00:00Z' },
    }
    expect(planStorageDownloads(remote, manifest).map(file => `${file.bucket}/${file.path}`)).toEqual([
      'guide-photos/pois/b.webp', 'qr-codes/c.png',
    ])
  })
})
