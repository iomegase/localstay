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
    <li className="flex items-start gap-2.5 border-b border-slate-200/80 py-2 text-[12px] leading-snug text-slate-600 last:border-b-0">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" strokeWidth={1.7} />
      <span>{item}</span>
    </li>
  )
}

function FeatureCard({
  number,
  eyebrow,
  heading,
  items,
}: {
  number: string
  eyebrow: string
  heading: string
  items: string[]
}) {
  if (items.length === 0) return null

  return (
    <article className="relative overflow-hidden rounded-[24px] bg-[#f8f7f5] px-5 pb-6 pt-5 before:absolute before:left-5 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600 md:min-h-[350px]">
      <span className="mb-7 block text-[42px] font-bold leading-none tracking-[-0.08em] text-slate-300">
        {number}
      </span>
      <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {eyebrow}
      </span>
      <h2 className="mb-4 mt-2 text-[22px] font-semibold leading-[1.15] tracking-[-0.035em] text-slate-800">
        {heading}
      </h2>
      <ul>{items.map(item => <FeatureItem item={item} key={item} />)}</ul>
    </article>
  )
}

export function LodgingFeatureSections({
  bedroomCount,
  bedCount,
  includedAmenities,
  onRequestAmenities,
}: {
  bedroomCount: number | null
  bedCount: number | null
  includedAmenities: string[]
  onRequestAmenities: string[]
}) {
  const sleeping = [
    bedroomCount == null ? null : `${bedroomCount} ${bedroomCount > 1 ? 'chambres' : 'chambre'}`,
    bedCount == null ? null : `${bedCount} ${bedCount > 1 ? 'couchages' : 'couchage'}`,
  ].filter((item): item is string => item !== null)

  return (
    <section
      data-testid="lodging-feature-sections"
      className="mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20 lg:grid-cols-3 xl:px-0"
    >
      <FeatureCard
        number="01"
        eyebrow="Couchages"
        heading="Des espaces pensés pour bien se retrouver."
        items={sleeping}
      />
      <FeatureCard
        number="02"
        eyebrow="Équipements"
        heading="Le confort essentiel, sur place."
        items={includedAmenities}
      />
      <FeatureCard
        number="03"
        eyebrow="Services sur demande"
        heading="Un séjour qui s’adapte à vos envies."
        items={onRequestAmenities}
      />
    </section>
  )
}
