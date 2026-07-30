import type { GuideLodging } from '@/features/guide-app/types'

export const demoLodging: GuideLodging = {
  id: 'demo-refuge-mont-blanc',
  name: 'Le Refuge du Mont-Blanc',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Un refuge fictif pensé pour découvrir l’expérience MyStay.',
  coverImage: '/marketing/guide-interior.png',
  // Galerie de démonstration — assets statiques locaux (aucun UUID réel, BR-25).
  gallery: [
    '/marketing/guide-interior.png',
    '/marketing/demo-lodging-1.webp',
    '/marketing/demo-lodging-2.webp',
    '/marketing/demo-lodging-3.webp',
    '/marketing/hero-chalet.png',
  ],
  latitude: 45.8921,
  longitude: 6.7085,
  addressLabel: '300 route du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: 'Refuge-Mont-Blanc',
  wifiPassword: 'Bienvenue2026',
  arrivalInstructions: [
    'L’arrivée est possible à partir de 16 h : prenez le temps de vous installer.',
    'Le logement se situe au 300 route du Mont-Blanc, à quelques minutes du centre du village.',
    'Récupérez les clés dans la boîte sécurisée à droite de l’entrée (code 1789).',
  ],
  departureInstructions: [
    'Libérer le logement avant 10 h.',
    'Fermer les fenêtres et éteindre les lumières.',
    'Déposer les déchets dans les conteneurs adaptés.',
    'Laisser les clés à l’emplacement indiqué dans votre véritable guide.',
  ],
  equipment: [
    'Cuisine équipée',
    'Lave-vaisselle',
    'Machine à café',
    'Lave-linge',
    'Local à skis',
    'Lit bébé sur demande',
  ],
  houseRules: [
    'Logement non-fumeur',
    'Respecter le calme de la résidence après 22 h',
    'Les fêtes ne sont pas autorisées',
    'Signaler rapidement toute anomalie à la conciergerie',
  ],
  practicalCards: [
    {
      id: 'demo-parking',
      title: 'Stationnement',
      description: 'Une place fictive est indiquée dans le guide réel remis au voyageur.',
      icon: 'car',
      videoUrl:
        '/video/social_davdev8307_Une_voiture_de_gare_sur_une_place_de_parking_vu_de_947eaaec-52b2-4eb0-a275-5fd32164ed2c_1.mp4',
    },
    {
      id: 'demo-heating',
      title: 'Chauffage',
      description: 'Le thermostat principal se règle depuis le séjour.',
      icon: 'thermometer',
    },
    {
      id: 'demo-waste',
      title: 'Tri des déchets',
      description: 'Verre, emballages et ordures ménagères disposent de bacs séparés.',
      icon: 'recycle',
    },
    {
      id: 'demo-contact',
      title: 'Assistance MyStay',
      description: 'Dans un véritable séjour, votre contact privé apparaît uniquement ici.',
      icon: 'messages-square',
      phone: '+33 4 50 47 76 08',
    },
  ],
  usefulNumbers: [
    { label: 'Urgences européennes', number: '112' },
    { label: 'SAMU', number: '15' },
    { label: 'Pompiers', number: '18' },
    { label: 'Office de tourisme', number: '04 50 47 76 08' },
  ],
}
