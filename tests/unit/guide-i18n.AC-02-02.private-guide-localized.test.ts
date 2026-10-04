/** @jest-environment node */
import { createHash } from 'node:crypto'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    contentTranslation: { findMany: jest.fn() },
  },
}))

import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { prisma } from '@/shared/lib/prisma'

const hash = (text: string) => createHash('sha256').update(text.trim()).digest('hex')
const translations = prisma.contentTranslation.findMany as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.lodging.findFirst as jest.Mock).mockResolvedValue({
    id: 'lodging-1',
    name: 'Le 305',
    city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais', latitude: 45.89, longitude: 6.71, transport_cards: [] },
    customization: { id: 'custom-1', welcome_message: null, trash_location: 'Local poubelles au sous-sol', trash_bins: [] },
    public_profile: null,
    practical_blocks: [
      { id: 'block-tv', title: 'Télévision', body: 'Netflix sur la Smart TV.', icon: 'tv', photo_url: null, video_url: null },
      { id: 'block-dryer', title: 'Sèche cheveux', body: 'Dans le tiroir.', icon: 'hair', photo_url: null, video_url: null },
    ],
    arrival_instructions: [
      { id: 'arrival-1', title: 'Accès', text: 'Prenez l’ascenseur.', tip: null, video_url: null, photos: [], kind: 'access', substeps: null, facts: null },
    ],
  })
  ;(prisma.lodgingFeaturedPoi.findMany as jest.Mock).mockResolvedValue([
    {
      id: 'featured-1',
      owner_note: 'Notre table préférée',
      poi: {
        id: 'poi-1', name: 'La Ferme de Cupelin', slug: 'cupelin', description: 'Ancienne ferme de 1850.', address: 'Route du Château',
        latitude: 45.88, longitude: 6.7, phone: null, website: null, rating: 4.8, rating_count: 1030, is_open_now: null, hours: null,
        photos: [], city: { slug: 'saint-gervais' }, category: { id: 'cat-1', slug: 'restaurants', name: 'Restaurant', icon: 'utensils' },
        trail_detail: null,
      },
    },
  ])
  translations.mockResolvedValue([
    { entity_type: 'LodgingPracticalBlock', entity_id: 'block-tv', field_name: 'title', source_text_hash: hash('Télévision'), translated_text: 'Television' },
    { entity_type: 'LodgingPracticalBlock', entity_id: 'block-tv', field_name: 'body', source_text_hash: hash('Netflix sur la Smart TV.'), translated_text: 'Netflix on the Smart TV.' },
    // Obsolète : le texte de l'hôte a changé depuis la traduction.
    { entity_type: 'LodgingPracticalBlock', entity_id: 'block-dryer', field_name: 'title', source_text_hash: hash('Sèche-cheveux'), translated_text: 'Hair dryer' },
    { entity_type: 'PointOfInterest', entity_id: 'poi-1', field_name: 'description', source_text_hash: hash('Ancienne ferme de 1850.'), translated_text: 'A former farm from 1850.' },
    { entity_type: 'LodgingFeaturedPoi', entity_id: 'featured-1', field_name: 'owner_note', source_text_hash: hash('Notre table préférée'), translated_text: 'Our favourite table' },
    { entity_type: 'Category', entity_id: 'cat-1', field_name: 'name', source_text_hash: hash('Restaurant'), translated_text: 'Restaurant' },
    { entity_type: 'LodgingArrivalInstruction', entity_id: 'arrival-1', field_name: 'text', source_text_hash: hash('Prenez l’ascenseur.'), translated_text: 'Take the lift.' },
    { entity_type: 'LodgingCustomization', entity_id: 'custom-1', field_name: 'trash_location', source_text_hash: hash('Local poubelles au sous-sol'), translated_text: 'Bin room in the basement' },
  ])
})

describe('061 A1 AC-02-02 — contenu traduit dans le guide privé', () => {
  it('en français : aucune lecture de traduction', async () => {
    const data = await getPrivateGuideData('lodging-1')
    expect(translations).not.toHaveBeenCalled()
    expect(data?.lodging.practicalCards[0].title).toBe('Télévision')
  })

  it('en anglais : traductions à jour appliquées, obsolètes ou absentes en français', async () => {
    const data = await getPrivateGuideData('lodging-1', 'en')
    const cards = data!.lodging.practicalCards
    expect(cards[0]).toMatchObject({ title: 'Television', description: 'Netflix on the Smart TV.' })
    expect(cards[1]).toMatchObject({ title: 'Sèche cheveux', description: 'Dans le tiroir.' })
    expect(data!.pois[0]).toMatchObject({ description: 'A former farm from 1850.', ownerNote: 'Our favourite table' })
    expect(data!.pois[0].category.name).toBe('Restaurant')
    expect(data!.pois[0].name).toBe('La Ferme de Cupelin')
    expect(data!.lodging.arrivalInstructions[0]).toMatchObject({ title: 'Accès', text: 'Take the lift.' })
    expect(data!.lodging.trashLocation).toBe('Bin room in the basement')
  })

  it('ne lit que les traductions anglaises publiables', async () => {
    await getPrivateGuideData('lodging-1', 'en')
    expect(translations).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ target_locale: 'en', deleted_at: null, status: { in: ['auto_translated', 'approved'] } }),
    }))
  })
})

describe('061 A1 — jamais bloquant', () => {
  it('si la lecture des traductions échoue, le guide s’affiche en français', async () => {
    translations.mockRejectedValueOnce(new Error('relation "ContentTranslation" does not exist'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const data = await getPrivateGuideData('lodging-1', 'en')
    expect(data?.lodging.practicalCards[0].title).toBe('Télévision')
    spy.mockRestore()
  })
})
