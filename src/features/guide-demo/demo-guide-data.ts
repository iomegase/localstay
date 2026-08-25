import type { GuideLodging } from '@/features/guide-app/types'
import {
  FIXED_DEPARTURE_INSTRUCTIONS,
  FIXED_HOUSE_RULES,
} from '@/features/guide-app/lib/fixed-lodging-content'
import { APPROVED_DEMO_LODGING_MEDIA } from './demo-media-policy'

export const demoLodging: GuideLodging = {
  id: 'demo-le-305',
  name: 'Le 305',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Un appartement fictif pour découvrir l’expérience MyStay.',
  coverImage: APPROVED_DEMO_LODGING_MEDIA[0],
  gallery: [...APPROVED_DEMO_LODGING_MEDIA],
  latitude: 45.8921,
  longitude: 6.7085,
  addressLabel: 'Résidence de démonstration, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: 'MyStay-Demo',
  wifiPassword: 'Demo-Uniquement',
  arrivalInstructions: [
    {
      title: 'Préparer votre arrivée',
      text: 'L’arrivée est possible à partir de 16 h. Les informations affichées dans cette démonstration sont fictives.',
      videoUrl: null,
      photos: [],
    },
    {
      title: 'Rejoindre la résidence',
      text: 'Suivez l’itinéraire transmis avec votre réservation. Aucun emplacement privé n’est publié dans cette démo.',
      videoUrl: null,
      photos: [],
    },
    {
      title: 'Entrer dans le logement',
      text: 'Dans un séjour réel, les instructions personnelles apparaissent ici de manière sécurisée.',
      videoUrl: null,
      photos: [],
    },
  ],
  departureInstructions: [...FIXED_DEPARTURE_INSTRUCTIONS],
  houseRules: [...FIXED_HOUSE_RULES],
  practicalCards: [
    {
      id: 'demo-television',
      title: 'Télévision',
      description: 'Le logement de démonstration dispose d’une Smart TV pour vos applications de streaming.',
      icon: 'tv',
    },
    {
      id: 'demo-heating',
      title: 'Chauffage',
      description: 'Le thermostat de démonstration se règle depuis la pièce principale.',
      icon: 'thermometer',
    },
    {
      id: 'demo-kitchen',
      title: 'Cuisine équipée',
      description: 'Plaques, four et lave-vaisselle sont présentés à titre d’exemple.',
      icon: 'cooking-pot',
    },
  ],
  usefulNumbers: [
    { label: 'Office de tourisme', number: '04 50 47 76 08' },
  ],
  trashBins: [{ type: 'jaune' }, { type: 'verte' }, { type: 'bordeaux' }],
  trashLocation: null,
}
