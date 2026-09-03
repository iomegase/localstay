/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import type { GuideLodging, GuidePoi } from '@/features/guide-app/types'

jest.mock('next/navigation', () => ({
  usePathname: () => '/sejour',
  useRouter: () => ({ push: jest.fn() }),
  redirect: jest.fn(),
}))

jest.mock('next/dynamic', () => () => {
  function DynamicGuideMapStub() {
    return <div>Chargement de la carte…</div>
  }

  return DynamicGuideMapStub
})

const privateLodging: GuideLodging = {
  id: 'lodging-active-73',
  name: 'Le Chalet Horizon',
  city: 'Saint-Gervais-Mont-Blanc',
  tagline: 'Bienvenue au Chalet Horizon',
  coverImage: '/marketing/hero-chalet-v2.png',
  gallery: ['/marketing/hero-chalet-v2.png'],
  latitude: 45.8912,
  longitude: 6.7124,
  addressLabel: '12 chemin des Sapins, Saint-Gervais-Mont-Blanc',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: 'Chalet-Horizon',
  wifiPassword: 'Montblanc-Invite',
  arrivalInstructions: [
    {
      title: 'Stationnement',
      text: 'Garez-vous sur l’emplacement gravillonné en face du chalet.',
      videoUrl: null,
      photos: [],
    },
  ],
  departureInstructions: [
    'Lancer le lave-vaisselle avant de partir.',
    'Déposer les clés sur la console d’entrée.',
  ],
  houseRules: ['Pas de fêtes.', 'Respecter le voisinage après 22 h.'],
  practicalCards: [
    {
      id: 'equipment-heating',
      title: 'Chauffage',
      description: 'Le thermostat principal se trouve dans le séjour.',
      icon: 'thermometer',
    },
    {
      id: 'recycling-point',
      title: 'Point de tri',
      description: 'Le point de tri communal se situe à 400 m du chalet.',
      icon: 'recycle',
    },
  ],
  usefulNumbers: [{ label: 'Conciergerie', number: '06 12 34 56 78' }],
  trashBins: [{ type: 'jaune' }, { type: 'verte' }],
  trashLocation: 'Point de tri communal, route des Thermes',
}

const privatePois: GuidePoi[] = [
  {
    id: 'poi-serac',
    name: 'Le Sérac',
    slug: 'le-serac',
    citySlug: 'saint-gervais-mont-blanc',
    category: {
      slug: 'restaurants',
      name: 'Restaurants',
      icon: 'utensils',
      color: '#ef4444',
    },
    description: 'Adresse locale connue pour sa terrasse et ses produits savoyards.',
    shortDescription: 'Cuisine savoyarde et terrasse plein sud.',
    photos: ['/images/poi/serac.jpg'],
    latitude: 45.891,
    longitude: 6.709,
    address: '5 place du Mont-Blanc',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=45.891,6.709',
    recommended: true,
    rating: 4.7,
    reviewCount: 128,
  },
]

describe('045 private active stay render isolation', () => {
  it('renders private stay screens from private fixtures without any demo ids, copy, or mode markers', () => {
    const { container } = render(
      <GuideApp
        mode="private"
        lodging={privateLodging}
        pois={privatePois}
        initialView="home"
        menuItems={[
          { label: 'Tous nos logements', view: 'lodgings' },
          { label: 'Blog', view: 'blog' },
          { label: 'Nous contacter', view: 'contact' },
        ]}
        lodgings={[
          {
            id: 'lodging-card-horizon',
            slug: 'chalet-horizon',
            citySlug: 'saint-gervais-mont-blanc',
            title: 'Le Chalet Horizon',
            cityName: 'Saint-Gervais-Mont-Blanc',
            propertyType: 'Chalet',
            coverPhotoUrl: '/marketing/hero-chalet-v2.png',
            shortDescription: 'Vue panoramique sur le massif du Mont-Blanc.',
            maxGuests: 6,
            bedroomCount: 3,
            surfaceM2: 92,
            publicAreaLabel: 'Saint-Gervais centre',
            amenities: ['Wifi', 'Parking'],
          },
        ]}
        blogPosts={[
          {
            id: 'blog-marche-local',
            slug: 'marche-local-du-jeudi',
            title: 'Le marché local du jeudi',
            excerpt: 'Nos repères pour faire ses courses à pied.',
            categoryLabel: 'Guide local',
            coverUrl: '/marketing/hero-chalet-v2.png',
            cityName: 'Saint-Gervais-Mont-Blanc',
          },
        ]}
        contact={{
          lodgingId: 'lodging-active-73',
          lodgingName: 'Le Chalet Horizon',
          cityName: 'Saint-Gervais-Mont-Blanc',
        }}
      />,
    )

    expect(container.querySelector('[data-guide-mode="private"]')).not.toBeNull()
    expect(container.querySelector('[data-guide-mode="demo"]')).toBeNull()
    expect(container.querySelector('[data-testid="autonomous-demo-guide"]')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au Chalet Horizon' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Explorer Saint-Gervais-Mont-Blanc 1 adresses sélectionnées/,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/démonstration|guide d['’]exemple/i)).toBeNull()
    expect(container.innerHTML).not.toMatch(/demo-[a-z0-9-]+/i)

    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
    expect(screen.getByText('16:00')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Informations pratiques/ }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Informations pratiques/ }),
    )
    expect(screen.getByText('Chalet-Horizon')).toBeInTheDocument()
    expect(screen.getByText('Montblanc-Invite')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    expect(screen.getByRole('heading', { name: 'Nos coups de cœur' })).toBeInTheDocument()
    expect(screen.getByText('Le Sérac')).toBeInTheDocument()
    expect(screen.queryByText(/démonstration|guide d['’]exemple/i)).toBeNull()
    expect(container.innerHTML).not.toMatch(/demo-[a-z0-9-]+/i)
  })
})
