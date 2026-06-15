import { detectExternalListingSource } from '../../src/features/lodging-showcase/lib/source-url'

describe('detectExternalListingSource', () => {
  it('detects Airbnb listing id without scraping', () => {
    expect(detectExternalListingSource('https://www.airbnb.fr/rooms/123456789')).toEqual({
      platform: 'airbnb',
      identifier: '123456789',
      metadataStatus: 'url_only',
    })
  })

  it('detects Booking as a verified external platform', () => {
    expect(detectExternalListingSource('https://www.booking.com/hotel/fr/chalet-demo.fr.html')).toEqual({
      platform: 'booking',
      identifier: null,
      metadataStatus: 'url_only',
    })
  })

  it('rejects non-https urls', () => {
    expect(() => detectExternalListingSource('http://www.airbnb.fr/rooms/123')).toThrow('EXTERNAL_URL_HTTPS_REQUIRED')
  })

  it('rejects unsupported domains', () => {
    expect(() => detectExternalListingSource('https://example.com/listing/1')).toThrow('EXTERNAL_PLATFORM_NOT_ALLOWED')
  })
})
