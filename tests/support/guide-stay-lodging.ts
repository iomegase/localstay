import type { GuideLodging, GuidePoi } from '@/features/guide-app/types'

/** Logement de test pour les écrans du guide de séjour (spec 054). */
export function buildStayLodging(overrides: Partial<GuideLodging> = {}): GuideLodging {
  return {
    id: 'lodging-1',
    name: 'Le 305',
    city: 'Saint-Gervais-les-Bains',
    tagline: 'Bienvenue',
    coverImage: '/cover.jpg',
    gallery: [],
    latitude: 45.89,
    longitude: 6.71,
    addressLabel: '305 route du Bettex, 74170 Saint-Gervais-les-Bains',
    checkIn: '16:00',
    checkOut: '10:00',
    wifiName: 'Le305_5G',
    wifiPassword: 'neige-2026',
    arrivalInstructions: [
      {
        title: 'Adresse', text: 'Résidence au bout de la route.', videoUrl: null, photos: ['/facade.jpg'],
        kind: 'address', tip: null, substeps: [], facts: [],
      },
      {
        title: 'Logement', text: 'Entrez par le hall B.', videoUrl: null, photos: [],
        kind: 'access', tip: 'Refermez bien le cache.',
        substeps: [{ title: 'Ouvrez la boîte', detail: 'À gauche de la porte.' }], facts: [],
      },
      {
        title: 'Garage', text: 'Deux places couvertes.', videoUrl: null, photos: [],
        kind: 'garage', tip: null, substeps: [], facts: [{ label: 'Niveau', value: '−2' }],
      },
    ],
    departureInstructions: ['Fermer les fenêtres', 'Sortir les poubelles'],
    houseRules: ['Non fumeur', 'Pas de fête'],
    practicalCards: [
      { id: 'c1', title: 'Cheminée', description: 'Allumez avec le papier.', icon: 'flame', photoUrl: '/fire.jpg' },
    ],
    usefulNumbers: [],
    trashBins: [],
    trashLocation: null,
    keyBoxCode: '4810',
    stats: { guests: 4, bedrooms: 2, surfaceM2: 52 },
    locationPrecise: true,
    facilibus: true,
    transportCards: [
      { id: 'card-taxi', title: 'Taxi', tag: 'Sur réservation', body: 'La conciergerie réserve votre taxi.' },
    ],
    ...overrides,
  }
}

export function buildStayPoi(overrides: Partial<GuidePoi> = {}): GuidePoi {
  return {
    id: 'poi-1',
    name: 'Le Bettex',
    slug: 'le-bettex',
    category: { slug: 'ski', name: 'Ski', icon: 'mountain', color: '#000' },
    description: 'Domaine skiable',
    shortDescription: 'Domaine skiable',
    photos: ['/bettex.jpg'],
    latitude: 45.88,
    longitude: 6.7,
    address: 'Le Bettex',
    directionsUrl: 'https://maps.example/bettex',
    ...overrides,
  }
}
