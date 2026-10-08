import { dumpFileName, dumpDate, expiredDumps, planStorageDownloads, waitForNetwork, isInBackupWindow } from '../../scripts/backup/lib'

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

describe('081 BR-06 — attente du réseau', () => {
  function clock() {
    let time = 0
    return { now: () => time, sleep: async (ms: number) => { time += ms } }
  }

  it('réseau absent au réveil de maintenance, puis disponible : attend et réussit', async () => {
    const results = [false, false, true]
    const onWait = jest.fn()
    const check = jest.fn(async () => results.shift() ?? true)
    await expect(waitForNetwork(check, { intervalMs: 30_000, maxWaitMs: 600_000, onWait, ...clock() })).resolves.toBe(true)
    expect(check).toHaveBeenCalledTimes(3)
    expect(onWait).toHaveBeenCalledTimes(1)
  })

  it('échec DNS levé = réseau absent ; abandon après le délai maximal', async () => {
    const check = jest.fn(async () => { throw new Error('ENOTFOUND') })
    await expect(waitForNetwork(check, { intervalMs: 30_000, maxWaitMs: 90_000, ...clock() })).resolves.toBe(false)
    expect(check).toHaveBeenCalledTimes(4)
  })

  it('réseau disponible tout de suite : aucune attente', async () => {
    const onWait = jest.fn()
    await expect(waitForNetwork(async () => true, { intervalMs: 30_000, maxWaitMs: 90_000, onWait, ...clock() })).resolves.toBe(true)
    expect(onWait).not.toHaveBeenCalled()
  })
})

describe('081 BR-07 — toutes les heures entre 9 h et 23 h', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 9, 8, hour, minute)

  it('ignorée la nuit et après 23 h (rattrapage launchd au réveil)', () => {
    for (const hour of [0, 3, 8, 23]) expect(isInBackupWindow(at(hour))).toBe(false)
    expect(isInBackupWindow(at(8, 59))).toBe(false)
  })

  it('lancée à chaque passage horaire de 9 h à 22 h', () => {
    for (let hour = 9; hour <= 22; hour += 1) expect(isInBackupWindow(at(hour))).toBe(true)
    expect(isInBackupWindow(at(22, 59))).toBe(true)
  })
})
