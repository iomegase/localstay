jest.unmock('@/features/maintenance/queries/maintenance')
const mockFindFirst = jest.fn()
const mockUpdate = jest.fn()
const mockCreate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { siteMaintenance: { findFirst: (...a: unknown[]) => mockFindFirst(...a), update: (...a: unknown[]) => mockUpdate(...a), create: (...a: unknown[]) => mockCreate(...a) } },
}))

import { DEFAULT_MAINTENANCE_MESSAGE, isMaintenanceBlockedPath } from '@/features/maintenance/lib/maintenance'
import { getMaintenanceState, isMaintenanceEnabled, resetMaintenanceCache, setMaintenanceState } from '@/features/maintenance/queries/maintenance'

// Spec 087 — état du mode maintenance.
describe('087 — règles', () => {
  it('AC-02-01 / AC-02-02 : seul le site public est fermé, la connexion reste ouverte', () => {
    expect(isMaintenanceBlockedPath('/', true)).toBe(true)
    expect(isMaintenanceBlockedPath('/decouvrir/megeve', true)).toBe(true)
    expect(isMaintenanceBlockedPath('/connexion', true)).toBe(false)
    expect(isMaintenanceBlockedPath('/sejour', false)).toBe(false)
    expect(isMaintenanceBlockedPath('/admin', false)).toBe(false)
  })
})

describe('087 — lecture et écriture', () => {
  beforeEach(() => { jest.clearAllMocks(); resetMaintenanceCache() })

  it('sans réglage : site ouvert, message par défaut', async () => {
    mockFindFirst.mockResolvedValue(null)
    expect(await getMaintenanceState()).toEqual({ enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE })
  })

  it('AC-01-02 : lecture mise en cache 15 s', async () => {
    mockFindFirst.mockResolvedValue({ id: 'm', enabled: true, message: null })
    expect(await isMaintenanceEnabled(1_000)).toBe(true)
    mockFindFirst.mockResolvedValue({ id: 'm', enabled: false, message: null })
    expect(await isMaintenanceEnabled(10_000)).toBe(true)
    expect(await isMaintenanceEnabled(17_000)).toBe(false)
    expect(mockFindFirst).toHaveBeenCalledTimes(2)
  })

  it('BR-02 : erreur de lecture → site ouvert', async () => {
    mockFindFirst.mockRejectedValue(new Error('db down'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await isMaintenanceEnabled()).toBe(false)
  })

  it('crée puis met à jour la ligne unique ; message vide → défaut', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValue({ enabled: true, message: null })
    expect(await setMaintenanceState({ enabled: true, message: '  ' }, 'admin-1')).toEqual({ enabled: true, message: DEFAULT_MAINTENANCE_MESSAGE })
    expect(mockCreate).toHaveBeenCalledWith({ data: { enabled: true, message: null, updated_by: 'admin-1' }, select: { enabled: true, message: true } })

    mockFindFirst.mockResolvedValueOnce({ id: 'm', enabled: true, message: null })
    mockUpdate.mockResolvedValue({ enabled: false, message: 'Retour à 18 h.' })
    expect(await setMaintenanceState({ enabled: false, message: 'Retour à 18 h.' }, 'admin-1')).toEqual({ enabled: false, message: 'Retour à 18 h.' })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'm' } }))
  })
})
