/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideHome } from '@/features/guide-app/components/GuideHome'
import type { GuideLodging } from '@/features/guide-app/types'

const lodging: GuideLodging = {
  id: 'lodging-1',
  name: 'Le Chalet Hygge',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Bienvenue',
  coverImage: '/chalet.jpg',
  gallery: [],
  latitude: 45.891,
  longitude: 6.713,
  addressLabel: 'Saint-Gervais-les-Bains',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: '',
  wifiPassword: '',
  arrivalInstructions: [],
  departureInstructions: [],
  houseRules: [],
  practicalCards: [],
  usefulNumbers: [],
  trashBins: [],
  trashLocation: null,
  presentationVideoUrl: 'https://youtu.be/dQw4w9WgXcQ',
}

describe('044-private-guide-lodging-video home module', () => {
  it('renders the video action before the lodging guide and loads no iframe', () => {
    render(<GuideHome lodging={lodging} pois={[]} onNavigate={jest.fn()} />)

    const video = screen.getByRole('button', { name: /^Voir la vidéo du logement/i })
    const guide = screen.getByRole('button', { name: /Découvrir le livret d'accueil/i })
    expect(
      video.compareDocumentPosition(guide) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Vidéo du logement' })).toBeNull()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('opens the dialog, keeps YouTube click-to-load, and closes every supported way', async () => {
    const user = userEvent.setup()
    render(<GuideHome lodging={lodging} pois={[]} onNavigate={jest.fn()} />)

    const opener = screen.getByRole('button', { name: /^Voir la vidéo du logement/i })
    await user.click(opener)
    expect(
      screen.getByRole('dialog', { name: 'Vidéo du logement' }),
    ).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()

    await user.click(
      screen.getByRole('button', {
        name: 'Lire la vidéo : Vidéo du logement',
      }),
    )
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    )

    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(opener)
    await user.click(screen.getByTestId('lodging-video-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(opener)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each([undefined, '', 'https://vimeo.com/123'])(
    'omits the whole module when the URL is %p',
    (presentationVideoUrl) => {
      render(
        <GuideHome
          lodging={{ ...lodging, presentationVideoUrl }}
          pois={[]}
          onNavigate={jest.fn()}
        />,
      )

      expect(
        screen.queryByRole('button', {
          name: /^Voir la vidéo du logement/i,
        }),
      ).toBeNull()
    },
  )
})
