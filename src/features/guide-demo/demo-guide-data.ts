import {
  APPROVED_DEMO_ACCESS_MEDIA,
  APPROVED_DEMO_LODGING_MEDIA,
} from './demo-media-policy'
import type { DemoLodging } from './types'

export const demoLodging: DemoLodging = {
  id: 'demo-le-305',
  name: 'Le 305',
  displayName: 'Le 305 — démonstration',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Un appartement fictif pour découvrir l’expérience MyStay.',
  coverImage: APPROVED_DEMO_LODGING_MEDIA[0],
  gallery: [...APPROVED_DEMO_LODGING_MEDIA],
  latitude: 45.8921,
  longitude: 6.7085,
  addressLabel: '96 rue du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  maxGuests: 4,
  bedroomCount: 2,
  surfaceM2: 62,
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: 'MyStay-Le305',
  wifiPassword: 'Le305-StGervais',
  arrivalInstructions: [
    {
      title: 'Le logement',
      text: 'Le 305 se trouve au 3e étage de la résidence, dans le centre de Saint-Gervais-les-Bains. Repérez la façade et l’entrée grâce aux photos et à la vidéo ci-dessous.',
      videoUrl: null,
      photos: [],
      photoPlaceholders: ['Vue extérieure du logement', 'Façade de la résidence'],
      videoPlaceholder: 'Vidéo de l’extérieur du logement',
    },
    {
      title: 'Accès au logement',
      text: 'Récupérez le trousseau dans la boîte à clés : son code vous est envoyé par message le jour de votre arrivée, à partir de 16 h. À l’entrée du bâtiment, présentez le badge entouré sur le lecteur de l’interphone (repère vert) pour ouvrir la porte.',
      videoUrl: null,
      photos: [APPROVED_DEMO_ACCESS_MEDIA[0], APPROVED_DEMO_ACCESS_MEDIA[1]],
      videoPlaceholder: 'Vidéo d’accès au logement',
    },
    {
      title: 'Le parking',
      text: 'Une place de parking privée vous est réservée, marquée « 305 ». Ouvrez la porte du parking avec la télécommande entourée sur le trousseau. Merci de ne pas stationner sur les places voisines.',
      videoUrl: null,
      photos: [APPROVED_DEMO_ACCESS_MEDIA[2]],
      videoPlaceholder: 'Vidéo du parking',
    },
  ],
  departureInstructions: [
    'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
    'Faire la vaisselle ou lancer le lave-vaisselle avant votre départ.',
    'Rassembler le linge de toilette utilisé dans la salle de bain.',
    'Laisser les draps en place sur les lits.',
    'Remettre les meubles, chaises et objets déplacés à leur emplacement d’origine.',
    'Fermer les fenêtres et les Velux.',
    'Éteindre les lumières ainsi que les appareils électriques inutiles.',
    'Ne pas éteindre le chauffage.',
    'Vérifier que vous n’avez rien oublié dans le logement.',
  ],
  houseRules: [
    'Respecter le logement de démonstration, son mobilier et le voisinage.',
    'Préserver le calme entre 22 h et 8 h.',
    'Utiliser les équipements conformément aux indications présentées.',
  ],
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
  // Numéros fictifs : plage ARCEP réservée à la fiction (04 65 71 xx xx).
  usefulNumbers: [
    { label: 'Conciergerie', number: '04 65 71 30 05', hint: 'Une question pendant votre séjour' },
    { label: 'Office de tourisme', number: '04 65 71 12 34', hint: 'Activités et informations locales' },
  ],
  emergencyNumbers: [
    { label: 'Secours', number: '112', hint: 'Numéro d’urgence européen, 24 h/24' },
  ],
  trashBins: [{ type: 'jaune' }, { type: 'verte' }, { type: 'bordeaux' }],
  trashLocation: 'Point de tri public du centre de Saint-Gervais',
}
