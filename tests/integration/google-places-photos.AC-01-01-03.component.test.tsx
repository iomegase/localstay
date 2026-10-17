/** @jest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react'
import { GooglePlacePhotos } from '@/features/google-places-photos/components/GooglePlacePhotos'

// Spec 103 AC-01-01/03/04 — bande de photos Google et crédits.
describe('103 — GooglePlacePhotos', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('affiche les photos et « Photos : Auteur · Auteur — Google Maps »', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: { photos: [
      { url: 'https://lh3.googleusercontent.com/p/1', width: 1200, height: 900, authors: [{ name: 'Marie', uri: 'https://maps.google.com/contrib/1' }] },
      { url: 'https://lh3.googleusercontent.com/p/2', width: 1200, height: 900, authors: [{ name: 'Paul', uri: null }, { name: 'Marie', uri: 'https://maps.google.com/contrib/1' }] },
    ] } }) })) as unknown as typeof fetch

    render(<GooglePlacePhotos poiRef="poi-1" name="Brasserie les Rhodos" label="Photos :" />)

    expect(await screen.findByAltText('Brasserie les Rhodos — photo 2')).toHaveAttribute('src', 'https://lh3.googleusercontent.com/p/2')
    expect(screen.getByTestId('google-place-photos')).toHaveTextContent('Photos : Marie · Paul — Google Maps')
    expect(screen.getByRole('link', { name: 'Marie' })).toHaveAttribute('href', 'https://maps.google.com/contrib/1')
    expect(global.fetch).toHaveBeenCalledWith('/api/places/photos?poi=poi-1', { cache: 'no-store' })
  })

  it('AC-01-04 : rien si la route répond 404 ou échoue', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch
    const { container } = render(<GooglePlacePhotos poiRef="poi-1" name="X" label="Photos :" />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
