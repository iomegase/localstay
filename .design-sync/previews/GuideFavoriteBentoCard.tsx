import { GuideFavoriteBentoCard } from '@mystay/design-system'

const H = 'https://www.mystay.city'
const cupelin = { id: 'cupelin', name: 'La Ferme de Cupelin', category: { slug: 'diner', name: 'Restaurant', icon: 'utensils', color: '#B94A48' }, photos: [`${H}/fallback/fallback-restaurant.png`], latitude: 45.88, longitude: 6.69, isOpenNow: true, distanceLabel: '11 min', distanceMode: 'walking' }
const lulu = { id: 'lulu', name: 'Lulu', category: { slug: 'cafes', name: 'Cafés', icon: 'coffee', color: '#8B5E3C' }, photos: [`${H}/fallback/fallback-cafe.png`], latitude: 45.89, longitude: 6.71, isOpenNow: false, distanceLabel: '10 min', distanceMode: 'walking' }
const rando = { id: 'porcherey', name: 'L’alpage de Porcherey', category: { slug: 'rando', name: 'Rando', icon: 'mountain', color: '#455E4C' }, photos: [`${H}/fallback/fallback-rando.png`], latitude: 45.82, longitude: 6.72, distanceLabel: '18 min', distanceMode: 'driving' }

export const Grid = () => (
  <div className="grid w-[375px] grid-cols-2 gap-3 bg-[#F6F6F4] p-3">
    <GuideFavoriteBentoCard poi={cupelin} variant="big" onSelectPoi={() => {}} onShowOnMap={() => {}} />
    <GuideFavoriteBentoCard poi={lulu} variant="compact" onSelectPoi={() => {}} onShowOnMap={() => {}} />
    <GuideFavoriteBentoCard poi={rando} variant="compact" onSelectPoi={() => {}} onShowOnMap={() => {}} />
  </div>
)

export const Compact = () => (
  <div className="w-[160px]">
    <GuideFavoriteBentoCard poi={lulu} variant="compact" onSelectPoi={() => {}} onShowOnMap={() => {}} />
  </div>
)
