/** @jest-environment node */
import { createHash } from 'node:crypto'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn(async () => []) },
    pointOfInterest: { findMany: jest.fn(async () => []) },
    poiPhotoMirror: { findMany: jest.fn(async () => []) },
    contentTranslation: { findMany: jest.fn() },
  },
}))

import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { prisma } from '@/shared/lib/prisma'

const hash = (text: string) => createHash('sha256').update(text.trim()).digest('hex')

// Spec 099 AC-02-04 : titre et description des « Choses à savoir » traduits en anglais (spec 061).
describe('099 AC-02-04 — Choses à savoir en anglais', () => {
  it('applique les traductions à jour du titre et de la description', async () => {
    ;(prisma.lodging.findFirst as jest.Mock).mockResolvedValue({
      id: 'lodging-1',
      name: 'Le 305',
      city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais', latitude: 45.89, longitude: 6.71, transport_cards: [] },
      customization: null,
      public_profile: null,
      practical_blocks: [],
      arrival_instructions: [],
      things_to_know: [{ id: 'k1', title: 'Volets roulants', body: 'Télécommande sur la cheminée.', photos: [] }],
    })
    ;(prisma.contentTranslation.findMany as jest.Mock).mockResolvedValue([
      { entity_type: 'LodgingThingToKnow', entity_id: 'k1', field_name: 'title', source_text_hash: hash('Volets roulants'), translated_text: 'Roller shutters' },
      { entity_type: 'LodgingThingToKnow', entity_id: 'k1', field_name: 'body', source_text_hash: hash('Télécommande sur la cheminée.'), translated_text: 'Remote on the mantelpiece.' },
    ])

    const data = await getPrivateGuideData('lodging-1', 'en')

    expect(data?.lodging.thingsToKnow).toEqual([
      { id: 'k1', title: 'Roller shutters', description: 'Remote on the mantelpiece.', photos: [] },
    ])
  })
})
