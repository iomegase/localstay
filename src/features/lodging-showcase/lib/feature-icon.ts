import {
  Bath,
  BedDouble,
  CarFront,
  ChefHat,
  Coffee,
  ConciergeBell,
  CookingPot,
  Flame,
  House,
  MapPin,
  Mountain,
  Plane,
  PlugZap,
  Shirt,
  ShoppingBasket,
  Sparkles,
  SprayCan,
  Sun,
  TreePine,
  Tv,
  WashingMachine,
  WavesLadder,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

const featureIcons: Array<[string[], LucideIcon]> = [
  [['chambre', 'lit', 'couchage'], BedDouble],
  [['salle de bain'], Bath],
  [['wi-fi', 'wifi'], Wifi],
  [['petit-déjeuner', 'petit déjeuner', 'petit-dejeuner'], Coffee],
  [['transfert aéroport', 'transfert'], Plane],
  [['ménage', 'nettoyage'], SprayCan],
  [['conciergerie', 'concierge'], ConciergeBell],
  [["courses à l'arrivée", 'courses à l’arrivée', 'courses'], ShoppingBasket],
  [['piscine'], WavesLadder],
  [['recharge'], PlugZap],
  [['parking'], CarFront],
  [['barbecue', 'cheminée'], Flame],
  [['cuisine'], CookingPot],
  [['linge', 'serviette'], Shirt],
  [['chef'], ChefHat],
  [['café'], Coffee],
  [['terrasse', 'balcon'], Sun],
  [['montagne'], Mountain],
  [['lave-linge'], WashingMachine],
  [['télévision', 'tv'], Tv],
  [['proximité', 'centre'], MapPin],
  [['extérieur', 'jardin'], TreePine],
  [['maison', 'chalet'], House],
]

/** Résout une icône Lucide sémantique pour un équipement/service (fallback Sparkles). */
export function featureIconFor(item: string): LucideIcon {
  const normalized = item.toLocaleLowerCase('fr')
  return (
    featureIcons.find(([terms]) => terms.some(term => normalized.includes(term)))?.[1] ??
    Sparkles
  )
}
