import { normalizeExternalUrl } from '@/features/lodging-showcase/lib/booking-url'
import { LodgingPublicProfileInputSchema } from '@/features/lodging-showcase/schemas'

// Spec 079 AC-02-03 — lien de réservation saisi sans https://.
describe('079 AC-02-03 — normalisation du lien de réservation', () => {
  it.each([
    ['airbnb.fr/h/saint-gervaist2', 'https://airbnb.fr/h/saint-gervaist2'],
    ['  www.airbnb.fr/rooms/123  ', 'https://www.airbnb.fr/rooms/123'],
    ['http://www.booking.com/hotel/fr/x.html', 'https://www.booking.com/hotel/fr/x.html'],
    ['https://www.airbnb.fr/rooms/123', 'https://www.airbnb.fr/rooms/123'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeExternalUrl(input)).toBe(expected)
  })

  it('vide → null', () => {
    expect(normalizeExternalUrl('  ')).toBeNull()
    expect(normalizeExternalUrl(null)).toBeNull()
  })

  it('le schéma du brouillon accepte et normalise, refuse sans domaine', () => {
    const field = LodgingPublicProfileInputSchema.shape.external_booking_url
    expect(field.parse('airbnb.fr/h/saint-gervaist2')).toBe('https://airbnb.fr/h/saint-gervaist2')
    expect(field.safeParse('pas une adresse').success).toBe(false)
  })
})
