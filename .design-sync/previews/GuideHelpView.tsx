import { GuideHelpView } from '@mystay/design-system'

const lodging = {
  id: 'le-305', name: 'Le 305', city: 'Saint-Gervais-les-Bains', tagline: 'Bienvenue',
  coverImage: '', gallery: [], latitude: 45.8915, longitude: 6.7085,
  addressLabel: '119 chemin des Prés, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00', checkOut: '10:00', wifiName: 'Le305_5G', wifiPassword: 'neige-2026',
  arrivalInstructions: [], departureInstructions: [], houseRules: [], practicalCards: [],
  usefulNumbers: [], trashBins: [], trashLocation: null, keyBoxCode: null,
  stats: { guests: 4, bedrooms: 2, surfaceM2: 37 }, locationPrecise: true, facilibus: true, transportCards: [],
}

export const HelpTab = () => (
  <div className="w-[375px]">
    <GuideHelpView lodging={lodging} onWrite={() => {}} />
  </div>
)

export const Demo = () => (
  <div className="w-[375px]">
    <GuideHelpView lodging={lodging} onWrite={() => {}} demo />
  </div>
)
