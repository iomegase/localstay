import { GuideDepartureView } from '@mystay/design-system'

const lodging = {
  id: 'le-305', name: 'Le 305', city: 'Saint-Gervais-les-Bains', tagline: '', coverImage: '', gallery: [],
  latitude: 45.8915, longitude: 6.7085, addressLabel: '', checkIn: '16:00', checkOut: '10:00', wifiName: '', wifiPassword: '',
  arrivalInstructions: [], houseRules: [], practicalCards: [], usefulNumbers: [], trashBins: [], trashLocation: null, keyBoxCode: null,
  stats: { guests: null, bedrooms: null, surfaceM2: null }, locationPrecise: false, facilibus: false, transportCards: [],
  departureInstructions: [
    'Déposer vos déchets au point de tri.',
    'Faire la vaisselle ou lancer le lave-vaisselle.',
    'Laisser les draps en place sur les lits.',
    'Fermer les fenêtres et les Velux.',
  ],
}

export const InProgress = () => (
  <div className="w-[375px]">
    <GuideDepartureView lodging={lodging} checked={new Set([0, 1])} onToggle={() => {}} departed={false} onDeparted={async () => {}} onBack={() => {}} />
  </div>
)

export const AllDone = () => (
  <div className="w-[375px]">
    <GuideDepartureView lodging={lodging} checked={new Set([0, 1, 2, 3])} onToggle={() => {}} departed={false} onDeparted={async () => {}} onBack={() => {}} />
  </div>
)

export const Departed = () => (
  <div className="w-[375px]">
    <GuideDepartureView lodging={lodging} checked={new Set([0, 1, 2, 3])} onToggle={() => {}} departed onDeparted={async () => {}} onBack={() => {}} />
  </div>
)
