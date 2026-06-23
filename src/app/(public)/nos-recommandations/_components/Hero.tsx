import Link from 'next/link'

type Props = {
  ownerName: string | null
  lodgingName: string
  cityName: string
  citySlug: string
  stats: { places: number; categories: number; cities: number }
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{label}</p>
    </div>
  )
}

export function Hero({ ownerName, lodgingName, cityName, citySlug, stats }: Props) {
  const title = ownerName ? `Les recommandations de ${ownerName}` : 'Les recommandations de votre hôte'
  const intro = ownerName
    ? `Une sélection personnelle de ${ownerName} pour profiter de ${cityName}.`
    : `Une sélection personnelle de votre hôte pour profiter de ${cityName}.`

  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] bg-charcoal p-5 text-white shadow-soft">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        Recommandations de l’hôte
      </div>

      <h1 className="font-serif text-4xl italic leading-[1.05]">{title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">{intro}</p>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Votre logement</p>
        <h2 className="mt-2 font-serif text-2xl italic">{lodgingName}</h2>
        <p className="mt-1 text-sm text-white/60">{cityName}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat value={stats.places} label="lieux" />
          <Stat value={stats.categories} label="catégories" />
          <Stat value={stats.cities} label="villes" />
        </div>
      </div>

      <Link
        href={`/guide/${citySlug}`}
        className="mt-5 inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 transition hover:border-gold hover:text-gold"
      >
        Guide complet
      </Link>
    </section>
  )
}
