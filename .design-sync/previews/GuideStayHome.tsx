import { GuideStayHome, GuideTransportRow } from '@mystay/design-system'

const H = 'https://www.mystay.city'
const lodging = {
  id: 'le-305', name: 'Le 305', city: 'Saint-Gervais-les-Bains', tagline: 'Bienvenue',
  coverImage: `${H}/marketing/hero-chalet-v2.png`, gallery: [], latitude: 45.8915, longitude: 6.7085,
  addressLabel: '119 chemin des Prés, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00', checkOut: '10:00', wifiName: 'Le305_5G', wifiPassword: 'neige-2026',
  presentationVideoUrl: 'https://youtu.be/dQw4w9WgXcQ',
  arrivalInstructions: [],
  departureInstructions: ['Fermer les fenêtres et les Velux.', 'Lancer le lave-vaisselle.', 'Laisser les draps en place.', 'Éteindre les lumières.'],
  houseRules: [], practicalCards: [], usefulNumbers: [], trashBins: [], trashLocation: null, keyBoxCode: null,
  stats: { guests: 4, bedrooms: 2, surfaceM2: 37 }, locationPrecise: true, facilibus: true, transportCards: [],
}
const pois = [
  { id: 'cupelin', name: 'La Ferme de Cupelin', category: { slug: 'diner', name: 'Restaurant', icon: 'utensils', color: '#B94A48' }, photos: [`${H}/fallback/fallback-restaurant.png`], latitude: 45.88, longitude: 6.69, isOpenNow: true },
  { id: 'lulu', name: 'Lulu', category: { slug: 'cafes', name: 'Cafés', icon: 'coffee', color: '#8B5E3C' }, photos: [`${H}/fallback/fallback-cafe.png`], latitude: 45.89, longitude: 6.71, isOpenNow: false },
  { id: 'musee', name: 'Musée Hautetour', category: { slug: 'culture', name: 'Culture', icon: 'landmark', color: '#455E4C' }, photos: [`${H}/fallback/fallback-culture.png`], latitude: 45.89, longitude: 6.71 },
]
const travelTimes = {
  cupelin: { walkingSeconds: 660, drivingSeconds: 360 },
  lulu: { walkingSeconds: 600, drivingSeconds: 180 },
  musee: { walkingSeconds: 2100, drivingSeconds: 420 },
}

export const StayHome = () => (
  <div className="w-[375px]">
    <GuideStayHome
      lodging={lodging}
      pois={pois}
      departureDone={1}
      travelTimes={travelTimes}
      onNavigate={() => {}}
      onOpenWifi={() => {}}
      onOpenPoi={() => {}}
      onShowPoiOnMap={() => {}}
      transportEntry={<GuideTransportRow onOpen={() => {}} />}
    />
  </div>
)
