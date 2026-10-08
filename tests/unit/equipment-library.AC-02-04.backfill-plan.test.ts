jest.mock('@/shared/lib/prisma', () => ({ prisma: {} }))

import { planEquipmentTemplates } from '@/features/equipment-library/queries/library'

describe('spec 095 AC-02-04 — reprise des équipements existants', () => {
  it('dédoublonne par nom sur tous les logements, ignore le tri et les noms vides, garde la 1re occurrence', () => {
    const plan = planEquipmentTemplates([
      { lodgingId: 'L1', title: ' Machine à café ', icon: 'utensils', body: ' Capsules. ' },
      { lodgingId: 'L2', title: 'MACHINE A CAFE', icon: 'info', body: 'Autre.' },
      { lodgingId: 'L2', title: 'Tri', icon: 'recycle', body: null },
      { lodgingId: 'L2', title: '  ', icon: 'info', body: null },
      { lodgingId: 'L2', title: 'Télévision', icon: 'tv', body: '' },
    ], new Set(['television']))
    expect(plan).toEqual([
      { title: 'Machine à café', title_key: 'machine a cafe', icon: 'utensils', body: 'Capsules.', source_lodging_id: 'L1' },
    ])
  })
})
