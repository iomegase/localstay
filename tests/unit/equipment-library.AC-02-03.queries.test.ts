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
  captureEquipmentTemplates,
  EquipmentTemplatePatchSchema,
  listApprovedEquipmentTemplates,
  listEquipmentTemplatesForAdmin,
  updateEquipmentTemplate,
} from '@/features/equipment-library/queries/library'

const row = (overrides: Record<string, unknown> = {}) => ({ id: 't1', title: 'Machine à café', icon: 'coffee', body: 'Nespresso', status: 'pending', created_at: new Date('2026-10-08'), ...overrides })

describe('spec 095 — bibliothèque d’équipements', () => {
  beforeEach(() => { jest.clearAllMocks(); mockCreateMany.mockResolvedValue({ count: 1 }) })

  it('AC-02-01 : nom comparé sans casse, accents ni espaces superflus', () => {
    expect(equipmentTitleKey('  Machine à  CAFÉ ')).toBe(equipmentTitleKey('machine a cafe'))
    expect(equipmentTitleKey('Lave-linge')).toBe('lave linge')
  })

  it('AC-02-01 / AC-02-02 / BR-02 : nouveaux noms « à valider », sans photo, sans doublon, sans tri des déchets', async () => {
    await captureEquipmentTemplates('lodging-1', [
      { title: 'Machine à café', icon: 'coffee', body: ' Nespresso ' },
      { title: 'MACHINE A CAFE', icon: 'coffee', body: 'doublon' },
      { title: 'Tri des déchets', icon: 'recycle', body: 'Local poubelles' },
      { title: '  ', icon: 'info', body: null },
      { title: 'Télévision', icon: 'tv', body: '' },
    ])
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        { title: 'Machine à café', title_key: 'machine a cafe', icon: 'coffee', body: 'Nespresso', source_lodging_id: 'lodging-1' },
        { title: 'Télévision', title_key: 'television', icon: 'tv', body: null, source_lodging_id: 'lodging-1' },
      ],
      skipDuplicates: true,
    })
  })

  it('aucun équipement à proposer : aucune écriture', async () => {
    await expect(captureEquipmentTemplates('lodging-1', [{ title: 'Tri', icon: 'recycle', body: null }])).resolves.toBe(0)
    expect(mockCreateMany).not.toHaveBeenCalled()
  })

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
    expect(EquipmentTemplatePatchSchema.safeParse({ photo_url: 'https://x' }).success).toBe(false)
    expect(EquipmentTemplatePatchSchema.safeParse({ body: '  ' }).success && EquipmentTemplatePatchSchema.parse({ body: '  ' }).body).toBeNull()
  })
})
