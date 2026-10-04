/** @jest-environment jsdom */
import {
  PWA_VALIDITY_DAYS,
  clearInstallRecord,
  ensureInstallRecord,
  installEndsAt,
  isInstallExpired,
  readInstallRecord,
} from '@/features/guide-pwa/lib/install-expiry'

const LODGING_ID = '11111111-1111-4111-8111-111111111111'
const KEY = `mystay:pwa:${LODGING_ID}`
const DAY = 24 * 60 * 60 * 1000

beforeEach(() => window.localStorage.clear())

describe('guide-pwa AC-03 — désactivation 7 jours après l’installation', () => {
  it('AC-03-01: enregistre la date de début à la première ouverture installée, une seule fois', () => {
    const start = new Date('2026-10-04T10:00:00.000Z')
    const record = ensureInstallRecord(LODGING_ID, start)
    expect(record).toEqual({ startedAt: start.toISOString() })
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '{}')).toEqual({ startedAt: start.toISOString() })

    const later = ensureInstallRecord(LODGING_ID, new Date('2026-10-06T10:00:00.000Z'))
    expect(later.startedAt).toBe(start.toISOString())
  })

  it('AC-03-01: fin = début + 7 jours', () => {
    expect(PWA_VALIDITY_DAYS).toBe(7)
    expect(installEndsAt({ startedAt: '2026-10-04T10:00:00.000Z' }).toISOString()).toBe('2026-10-11T10:00:00.000Z')
  })

  it('AC-03-02: expiré seulement après la date de fin', () => {
    const record = { startedAt: '2026-10-04T10:00:00.000Z' }
    const start = Date.parse(record.startedAt)
    expect(isInstallExpired(record, new Date(start + 7 * DAY - 1))).toBe(false)
    expect(isInstallExpired(record, new Date(start + 7 * DAY))).toBe(true)
  })

  it('ignore un enregistrement illisible', () => {
    window.localStorage.setItem(KEY, '{oops')
    expect(readInstallRecord(LODGING_ID)).toBeNull()
    window.localStorage.setItem(KEY, JSON.stringify({ startedAt: 'pas une date' }))
    expect(readInstallRecord(LODGING_ID)).toBeNull()
  })

  it('AC-03-04: une nouvelle entrée QR efface la date de début du logement', () => {
    ensureInstallRecord(LODGING_ID, new Date('2026-01-01T00:00:00.000Z'))
    clearInstallRecord(LODGING_ID)
    expect(readInstallRecord(LODGING_ID)).toBeNull()
  })

  it('reste silencieux si le stockage est indisponible', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readInstallRecord(LODGING_ID)).toBeNull()
    spy.mockRestore()
  })
})
