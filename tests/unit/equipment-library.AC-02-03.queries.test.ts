const mockCreateMany = jest.fn()
const mockFindFirst = jest.fn()
const mockUpdate = jest.fn()
const mockFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    equipmentTemplate: {
      createMany: (...a: unknown[]) => mockCreateMany(...a),
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      findMany: (...a: unknown[]) => mockFindMany(...a),
    },
  },
}))

import { equipmentTitleKey } from '@/features/equipment-library/lib/title-key'
import {
  createEquipmentTemplate,
  EquipmentTemplatePatchSchema,
  listApprovedEquipmentTemplates,
  listEquipmentTemplatesForAdmin,
  updateEquipmentTemplate,
} from '@/features/equipment-library/queries/library'

const row = (overrides: Record<string, unknown> = {}) => ({ id: 't1', title: 'Machine à café', icon: 'coffee', body: 'Nespresso', photo_url: null, video_url: null, status: 'pending', created_at: new Date('2026-10-08'), ...overrides })

describe('spec 095 — bibliothèque d’équipements', () => {
  beforeEach(() => { jest.clearAllMocks(); mockCreateMany.mockResolvedValue({ count: 1 }) })

  it('AC-02-01 : nom comparé sans casse, accents ni espaces superflus', () => {
    expect(equipmentTitleKey('  Machine à  CAFÉ ')).toBe(equipmentTitleKey('machine a cafe'))
    expect(equipmentTitleKey('Lave-linge')).toBe('lave linge')
  })

  // 095 AC-02-01/02 (alimentation par les propriétaires) : supprimé par la spec 096 AC-03-03.

  it('BR-01 : seuls les équipements validés sont proposés', async () => {
    mockFindMany.mockResolvedValue([row({ status: 'approved' })])
    await listApprovedEquipmentTemplates()
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'approved', deleted_at: null } }))
  })

  it('AC-03-01 : à valider, puis validés, puis refusés', async () => {
    mockFindMany.mockResolvedValue([row({ id: 'a', status: 'rejected', title: 'A' }), row({ id: 'b', status: 'approved', title: 'B' }), row({ id: 'c', status: 'pending', title: 'C' })])
    expect((await listEquipmentTemplatesForAdmin()).map(t => t.status)).toEqual(['pending', 'approved', 'rejected'])
  })

  it('AC-03-02 : valider enregistre la relecture ; un nom déjà pris est refusé ; inconnu → 404', async () => {
    mockFindFirst.mockResolvedValueOnce({ id: 't1' })
    mockUpdate.mockResolvedValue(row({ status: 'approved' }))
    await updateEquipmentTemplate('t1', { status: 'approved' }, 'admin-1')
    expect(mockUpdate.mock.calls[0][0].data).toMatchObject({ status: 'approved', reviewed_by: 'admin-1', reviewed_at: expect.any(Date) })

    mockFindFirst.mockResolvedValueOnce({ id: 't1' }).mockResolvedValueOnce({ id: 'autre' })
    await expect(updateEquipmentTemplate('t1', { title: 'Télévision' }, 'admin-1')).rejects.toMatchObject({ code: 'TITLE_ALREADY_EXISTS', status: 409 })

    mockFindFirst.mockResolvedValueOnce(null)
    await expect(updateEquipmentTemplate('zz', { status: 'approved' }, 'admin-1')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })

  it('PATCH : icône inconnue ou champ non prévu refusés', () => {
    expect(EquipmentTemplatePatchSchema.safeParse({ icon: 'pas-une-icone' }).success).toBe(false)
    expect(EquipmentTemplatePatchSchema.safeParse({ source_lodging_id: 'x' }).success).toBe(false)
    // Spec 096 AC-01-02 : photo et vidéo modifiables par l'admin ; chaîne vide = retrait.
    expect(EquipmentTemplatePatchSchema.parse({ photo_url: 'https://x/a.webp', video_url: '' })).toEqual({ photo_url: 'https://x/a.webp', video_url: null })
    expect(EquipmentTemplatePatchSchema.safeParse({ video_url: 'https://vimeo.com/1' }).success).toBe(false)
    expect(EquipmentTemplatePatchSchema.safeParse({ body: '  ' }).success && EquipmentTemplatePatchSchema.parse({ body: '  ' }).body).toBeNull()
  })

  it('spec 096 AC-01-01 : création admin directement validée ; nom déjà pris → 409', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const create = jest.fn().mockResolvedValue(row({ status: 'approved', photo_url: 'https://cdn/a.webp' }))
    const { prisma } = jest.requireMock('@/shared/lib/prisma') as { prisma: { equipmentTemplate: Record<string, unknown> } }
    prisma.equipmentTemplate.create = create
    await expect(createEquipmentTemplate({ title: 'Barbecue', icon: 'umbrella', photo_url: 'https://cdn/a.webp' }, 'admin-1'))
      .resolves.toMatchObject({ status: 'approved', photo_url: 'https://cdn/a.webp' })
    expect(create.mock.calls[0][0].data).toMatchObject({
      title: 'Barbecue', title_key: 'barbecue', icon: 'umbrella', body: null, photo_url: 'https://cdn/a.webp', video_url: null,
      status: 'approved', reviewed_by: 'admin-1',
    })
    mockFindFirst.mockResolvedValueOnce({ id: 'autre' })
    await expect(createEquipmentTemplate({ title: 'BARBECUE', icon: 'info' }, 'admin-1')).rejects.toMatchObject({ code: 'TITLE_ALREADY_EXISTS', status: 409 })
  })
})
