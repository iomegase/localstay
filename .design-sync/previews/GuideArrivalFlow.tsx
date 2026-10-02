import { GuideArrivalFlow } from '@mystay/design-system'

const H = 'https://www.mystay.city'
const base = {
  id: 'le-305', name: 'Le 305', city: 'Saint-Gervais-les-Bains', tagline: 'Bienvenue',
  coverImage: '', gallery: [], latitude: 45.8915, longitude: 6.7085,
  addressLabel: '119 chemin des Prés, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00', checkOut: '10:00', wifiName: 'Le305_5G', wifiPassword: 'neige-2026',
  departureInstructions: [], houseRules: [], practicalCards: [], usefulNumbers: [], trashBins: [], trashLocation: null,
  stats: { guests: 4, bedrooms: 2, surfaceM2: 37 }, locationPrecise: true, facilibus: true, transportCards: [],
}
const address = {
  title: 'Trouver le logement', text: 'La résidence se trouve au bout du chemin, face à la télécabine.',
  videoUrl: null, photos: [`${H}/marketing/hero-chalet-v2.png`, `${H}/demo/entree-batiment-interphone.webp`],
  kind: 'address', tip: null, substeps: [], facts: [],
}
const access = {
  title: 'Accéder au logement', text: 'Les clés et le badge du garage sont dans la boîte à clés à côté de l’entrée.',
  videoUrl: null, photos: [`${H}/demo/acces-logement-trousseau.webp`, `${H}/demo/entree-batiment-interphone.webp`, `${H}/demo/parking-telecommande.webp`],
  kind: 'access', tip: 'Refermez bien le cache de la boîte après usage.',
  substeps: [
    { title: 'Ouvrez la boîte à clés', detail: 'Elle est fixée à droite de la porte d’entrée.' },
    { title: 'Badgez à l’interphone', detail: 'Présentez le badge rond sur le lecteur (repère vert).' },
  ],
  facts: [{ label: 'Étage', value: '3e' }, { label: 'Porte', value: '305' }],
}
const garage = {
  title: 'Accès au garage', text: 'Si vous venez en voiture, entrez directement par le garage.',
  videoUrl: null, photos: [`${H}/demo/parking-telecommande.webp`],
  kind: 'garage', tip: null, substeps: [{ title: 'Digicode', detail: 'Le digicode se trouve à droite de la porte du garage.' }],
  facts: [{ label: 'Niveau', value: '−2' }, { label: 'Place', value: '46' }, { label: 'Hauteur', value: '1,90 m' }],
}

export const AddressStep = () => (
  <div className="w-[375px]">
    <GuideArrivalFlow lodging={{ ...base, keyBoxCode: '4810', arrivalInstructions: [address, access, garage] }} arrived={false} onArrived={async () => {}} onBack={() => {}} />
  </div>
)

export const AccessStepWithKeyCode = () => (
  <div className="w-[375px]">
    <GuideArrivalFlow lodging={{ ...base, keyBoxCode: '4810', arrivalInstructions: [access, garage] }} arrived={false} onArrived={async () => {}} onBack={() => {}} />
  </div>
)

export const GarageStepWithFacts = () => (
  <div className="w-[375px]">
    <GuideArrivalFlow lodging={{ ...base, keyBoxCode: null, arrivalInstructions: [garage] }} arrived={false} onArrived={async () => {}} onBack={() => {}} />
  </div>
)
