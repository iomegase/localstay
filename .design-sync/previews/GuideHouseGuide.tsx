import { GuideHouseGuide } from '@mystay/design-system'

const H = 'https://www.mystay.city'
const lodging = {
  id: 'le-305', name: 'Le 305', city: 'Saint-Gervais-les-Bains', tagline: '', coverImage: '', gallery: [],
  latitude: 45.8915, longitude: 6.7085, addressLabel: '', checkIn: '16:00', checkOut: '10:00', wifiName: '', wifiPassword: '',
  arrivalInstructions: [], departureInstructions: [], keyBoxCode: null,
  stats: { guests: null, bedrooms: null, surfaceM2: null }, locationPrecise: true, facilibus: false, transportCards: [],
  practicalCards: [
    { id: 'tv', title: 'Télévision', description: 'Smart TV du séjour avec Netflix et YouTube. Allumez-la avec la télécommande noire.', icon: 'tv', photoUrl: `${H}/marketing/guide-interior.png` },
    { id: 'heat', title: 'Chauffage', description: 'Thermostat à côté de la porte d’entrée, réglez-le entre 19 et 21 °C.', icon: 'thermometer' },
    { id: 'plumber', title: 'Plombier d’astreinte', description: 'En cas de fuite, coupez l’eau sous l’évier puis appelez.', icon: 'wrench', phone: '04 50 00 00 00' },
  ],
  houseRules: [
    'Merci de respecter le logement, son mobilier ainsi que le voisinage pendant toute la durée de votre séjour.',
    'Les fêtes et nuisances sonores, notamment entre 22 h et 8 h, ne sont pas autorisées.',
    "Merci d'utiliser les équipements conformément à leur destination et de nous signaler rapidement tout incident ou dommage.",
  ],
  usefulNumbers: [{ label: 'Office de tourisme', number: '04 50 47 76 08' }], trashBins: [], trashLocation: null,
}

export const HouseGuide = () => (
  <div className="w-[375px]">
    <GuideHouseGuide lodging={lodging} onBack={() => {}} onOpenPractical={() => {}} />
  </div>
)
