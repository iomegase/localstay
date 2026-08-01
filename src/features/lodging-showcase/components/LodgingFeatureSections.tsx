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

function FeatureItem({ item }: { item: string }) {
  const normalized = item.toLocaleLowerCase('fr')
  const Icon = featureIcons.find(([terms]) => terms.some(term => normalized.includes(term)))?.[1] ?? Sparkles

  return (
    <li className="flex items-center gap-3 border-b border-slate-200/70 py-3 text-[12px] leading-snug text-slate-600 last:border-b-0">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={1.7} />
      <span>{item}</span>
    </li>
  )
}

function FeatureCard({ eyebrow, items }: { eyebrow: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <article className="relative overflow-hidden rounded-[24px] bg-[#f8f7f5] px-6 pb-6 pt-7 before:absolute before:left-6 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600 md:min-h-[320px]">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {eyebrow}
      </span>
      <ul className="mt-4">{items.map(item => <FeatureItem item={item} key={item} />)}</ul>
    </article>
  )
}

export function LodgingFeatureSections({
  includedAmenities,
  onRequestAmenities,
}: {
  includedAmenities: string[]
  onRequestAmenities: string[]
}) {
  return (
    <section
      data-testid="lodging-feature-sections"
      className="mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20 xl:px-0"
    >
      <FeatureCard eyebrow="Équipements" items={includedAmenities} />
      <FeatureCard eyebrow="Services sur demande" items={onRequestAmenities} />
    </section>
  )
}
