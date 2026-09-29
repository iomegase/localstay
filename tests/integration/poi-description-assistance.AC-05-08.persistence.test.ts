const mockFindUnique = jest.fn()
const mockFindFirst = jest.fn()
const mockUpdate = jest.fn()
const mockAudit = jest.fn()
const mockGenerate = jest.fn()
const mockTransaction = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  pointOfInterest: { findUnique: (...args: unknown[]) => mockFindUnique(...args), findFirst: (...args: unknown[]) => mockFindFirst(...args), update: (...args: unknown[]) => mockUpdate(...args) },
  city: { findFirst: jest.fn(async () => ({ id: 'city' })) }, category: { findFirst: jest.fn(async () => ({ id: 'category' })) },
  subCategory: { findFirst: jest.fn() }, poiAcquisitionAuditLog: { create: (...args: unknown[]) => mockAudit(...args) },
  $transaction: (...args: unknown[]) => mockTransaction(...args),
} }))
jest.mock('@/features/poi-description-assistance/services/generate-description', () => ({ generatePoiDescription: (...args: unknown[]) => mockGenerate(...args) }))
import { suggestPoiDescription } from '@/features/poi-description-assistance/queries/suggest-description'
import { updateAdminPoi } from '@/features/admin-pois/queries/admin-pois'

const id = '44444444-4444-4444-8444-444444444444'
const row = {
  id, name: 'Refuge', slug: 'refuge', description: null, address: 'Saint-Gervais', website: null, phone: null,
  photos: [], tags: [], latitude: 45.8, longitude: 6.7, is_active: true, deleted_at: null,
  geocode_status: 'success', photos_status: 'ok', review_source: 'MANUAL', updated_at: new Date(),
  discovery_status: 'DRAFT', discovery_published_at: null, city_id: 'city', category_id: 'category', subcategory_id: null,
  city: { id: 'city', name: 'Saint-Gervais', slug: 'saint-gervais', is_active: true, deleted_at: null, latitude: 45.8, longitude: 6.7 },
  category: { id: 'category', name: 'Refuges', slug: 'refuges', is_active: true, deleted_at: null },
  subcategory: null, merchant_profile: null, trail_detail: null,
}
beforeEach(() => {
  jest.clearAllMocks()
  mockFindUnique.mockResolvedValue(row)
  mockFindFirst.mockResolvedValue(row)
  mockGenerate.mockResolvedValue({ description: 'Proposition à relire.' })
  mockTransaction.mockImplementation(async callback => callback({ pointOfInterest: { findFirst: mockFindFirst, update: mockUpdate }, poiAcquisitionAuditLog: { create: mockAudit } }))
})

it('AC-05: reads saved identity without mutating or auditing a suggestion', async () => {
  await suggestPoiDescription(id)
  expect(mockGenerate).toHaveBeenCalledWith({ name: row.name, address: row.address, city: row.city.name, website: null })
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(mockAudit).not.toHaveBeenCalled()
  expect(mockTransaction).not.toHaveBeenCalled()
})

it('rejects missing, archived and invalid identities before generation', async () => {
  await expect(suggestPoiDescription('bad')).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  mockFindUnique.mockResolvedValueOnce(null)
  await expect(suggestPoiDescription(id)).rejects.toMatchObject({ code: 'POI_NOT_FOUND' })
  mockFindUnique.mockResolvedValueOnce({ ...row, deleted_at: new Date() })
  await expect(suggestPoiDescription(id)).rejects.toMatchObject({ code: 'POI_ARCHIVED' })
  expect(mockGenerate).not.toHaveBeenCalled()
})

it('AC-08: saves accepted text with an audit, without publishing Découvrir', async () => {
  mockUpdate.mockResolvedValue({ ...row, description: 'Texte corrigé et validé.' })
  const result = await updateAdminPoi(id, { description: 'Texte corrigé et validé.', force_geocode: false, confirm_geocode_pending_review: false }, 'admin')
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { description: 'Texte corrigé et validé.' } }))
  expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'poi_updated', admin_id: 'admin', before: expect.objectContaining({ description: null }), after: expect.objectContaining({ description: 'Texte corrigé et validé.' }) }) }))
  expect(result.data.discovery_status).toBe('DRAFT')
})
