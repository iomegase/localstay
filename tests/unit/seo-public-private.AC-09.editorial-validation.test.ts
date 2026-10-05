import { LodgingPublicProfileInputSchema } from '@/features/lodging-showcase/schemas'
import { CityUpdateSchema } from '@/features/admin/schemas/city'

const input = { title: 'Appartement  Vue  Mont Blanc  - 6 p', short_description: 'Un séjour en montagne.', description: 'x'.repeat(120), property_type: 'Appartement', max_guests: 6, public_contact_enabled: true, amenities: [], photos: [] }

describe('C-14 validation éditoriale', () => {
  it('réduit les espaces du titre sans renommer le logement', () => {
    expect(LodgingPublicProfileInputSchema.parse(input).title).toBe('Appartement Vue Mont Blanc - 6 p')
  })
  it.each([['saint gervais les bains', 'Saint-Gervais-les-Bains'], ['saint nicolas de veroce', 'Saint-Nicolas-de-Véroce'], ['centre  historique', 'Centre historique'], ['Évian-les-Bains', 'Évian-les-Bains']])('normalise la zone %s', (raw, expected) => {
    expect(LodgingPublicProfileInputSchema.parse({ ...input, public_area_label: raw }).public_area_label).toBe(expected)
  })
  it('normalise la commune dans la validation admin', () => {
    expect(CityUpdateSchema.parse({ name: 'saint gervais les bains', postal_code: '74170' }).name).toBe('Saint-Gervais-les-Bains')
  })
})
