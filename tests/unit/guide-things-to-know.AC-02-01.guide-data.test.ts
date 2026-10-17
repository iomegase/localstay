/** @jest-environment node */

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn(async () => []) },
    poiPhotoMirror: { findMany: jest.fn(async () => []) },
  },
}))

import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { prisma } from '@/shared/lib/prisma'

// Spec 099 AC-02-01 : les cartes de l'Owner alimentent le guide logement, dans l'ordre.
describe('099 AC-02-01 — données du guide privé', () => {
  it('mappe les « Choses à savoir » (titre, description, photos)', async () => {
    ;(prisma.lodging.findFirst as jest.Mock).mockResolvedValue({
      id: 'lodging-1',
      name: 'Le 305',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      practical_blocks: [],
      arrival_instructions: [],
      things_to_know: [
        { id: 'k1', title: 'Volets', body: 'Télécommande sur la cheminée.', photos: ['/a.jpg'] },
        { id: 'k2', title: 'Local à skis', body: null, photos: [] },
      ],
    })

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.thingsToKnow).toEqual([
      { id: 'k1', title: 'Volets', description: 'Télécommande sur la cheminée.', photos: ['/a.jpg'] },
      { id: 'k2', title: 'Local à skis', description: '', photos: [] },
    ])
    const query = (prisma.lodging.findFirst as jest.Mock).mock.calls[0][0]
    expect(query.select.things_to_know).toEqual({
      where: { deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: { id: true, title: true, body: true, photos: true },
    })
  })
})
