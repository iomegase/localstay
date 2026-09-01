import { demoLodging } from './demo-guide-data'
import { APPROVED_DEMO_LODGING_MEDIA } from './demo-media-policy'
import { demoPois } from './demo-pois'
import type {
  DemoBlogPost,
  DemoContact,
  DemoGuideData,
  DemoLodgingCard,
} from './types'

const demoLodgingCards = [
  {
    id: 'demo-chalet-des-cimes',
    slug: 'demo-chalet-des-cimes',
    citySlug: 'saint-gervais-les-bains',
    title: 'Chalet des Cimes — démonstration',
    cityName: 'Saint-Gervais-les-Bains',
    propertyType: 'Chalet fictif',
    coverPhotoUrl: APPROVED_DEMO_LODGING_MEDIA[1],
    shortDescription: 'Un chalet fictif imaginé pour présenter le guide MyStay.',
    description:
      'Ce chalet de démonstration illustre une fiche locale complète sans correspondre à un hébergement réel.',
    maxGuests: 6,
    bedroomCount: 3,
    bathroomCount: 2,
    surfaceM2: 95,
    publicAreaLabel: 'Secteur fictif des hauteurs',
    photos: [
      {
        url: APPROVED_DEMO_LODGING_MEDIA[1],
        alt: 'Intérieur fictif du Chalet des Cimes',
      },
      {
        url: APPROVED_DEMO_LODGING_MEDIA[2],
        alt: 'Salon fictif du Chalet des Cimes',
      },
    ],
    amenitiesIncluded: ['Cuisine équipée', 'Chauffage', 'Vue montagne'],
    amenitiesOnRequest: ['Lit bébé'],
  },
  {
    id: 'demo-studio-du-parc',
    slug: 'demo-studio-du-parc',
    citySlug: 'saint-gervais-les-bains',
    title: 'Studio du Parc — démonstration',
    cityName: 'Saint-Gervais-les-Bains',
    propertyType: 'Studio fictif',
    coverPhotoUrl: APPROVED_DEMO_LODGING_MEDIA[3],
    shortDescription: 'Un pied-à-terre fictif proche des services du centre.',
    description:
      'Ce studio entièrement fictif sert uniquement à montrer une seconde fiche logement dans la démonstration publique.',
    maxGuests: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    surfaceM2: 28,
    publicAreaLabel: 'Centre de Saint-Gervais',
    photos: [
      {
        url: APPROVED_DEMO_LODGING_MEDIA[3],
        alt: 'Pièce de vie fictive du Studio du Parc',
      },
    ],
    amenitiesIncluded: ['Kitchenette', 'Wi-Fi fictif', 'Chauffage'],
    amenitiesOnRequest: [],
  },
] satisfies readonly DemoLodgingCard[]

const demoBlogPosts = [
  {
    id: 'demo-blog-week-end-saint-gervais',
    slug: 'demo-week-end-saint-gervais',
    title: 'Un week-end de démonstration à Saint-Gervais',
    excerpt:
      'Un itinéraire éditorial fictif pour découvrir les vues blog du guide.',
    categoryLabel: 'Inspiration locale',
    coverUrl: APPROVED_DEMO_LODGING_MEDIA[2],
    cityName: 'Saint-Gervais-les-Bains',
    contentMarkdown:
      '## Une journée au village\n\nCommencez par le centre, puis choisissez une adresse publique parmi les recommandations de la démonstration.\n\n## Prendre le temps\n\nCe contenu est fictif et illustre la lecture d’un article local dans MyStay.',
  },
  {
    id: 'demo-blog-escapade-montagne',
    slug: 'demo-escapade-montagne',
    title: 'Préparer une escapade en montagne',
    excerpt:
      'Quelques repères génériques pour illustrer un conseil de séjour local.',
    categoryLabel: 'Conseils voyage',
    coverUrl: APPROVED_DEMO_LODGING_MEDIA[1],
    cityName: 'Saint-Gervais-les-Bains',
    contentMarkdown:
      '## Avant de partir\n\nConsultez la météo et adaptez votre équipement à la saison.\n\n## Sur place\n\nPrivilégiez les informations publiques et les sentiers balisés. Cet article de démonstration ne remplace pas les consignes locales.',
  },
] satisfies readonly DemoBlogPost[]

const demoContact = {
  lodgingName: 'Le 305 — démonstration',
  cityName: 'Saint-Gervais-les-Bains',
  hostName: 'Camille, hôte fictif',
  responseLabel: 'Formulaire désactivé dans la démonstration publique',
} satisfies DemoContact

export const demoGuideData: DemoGuideData = {
  lodging: demoLodging,
  favoritePois: demoPois.filter(poi => poi.recommended),
  lodgingCards: demoLodgingCards,
  blogPosts: demoBlogPosts,
  contact: demoContact,
}
