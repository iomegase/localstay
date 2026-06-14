import Link from 'next/link'
import { Users, BedDouble, MapPin, ChevronRight, Sparkles } from 'lucide-react'

interface LodgingCardProps {
  href: string
  title: string
  coverPhotoUrl: string | null
  shortDescription: string
  propertyType: string
  maxGuests: number
  bedroomCount: number | null
  publicAreaLabel: string | null
  amenities: string[]
}

export function LodgingCard({
  href,
  title,
  coverPhotoUrl,
  shortDescription,
  propertyType,
  maxGuests,
  bedroomCount,
  publicAreaLabel,
  amenities,
}: LodgingCardProps) {
  return (
    // Le cadre extérieur blanc (comme sur le screenshot) avec une ombre douce
    <article className="group relative w-full rounded-[2rem] bg-white p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)]">
      <Link href={href} className="relative block w-full overflow-hidden rounded-[1.5rem] bg-zinc-900">
        
        {/* L'image en pleine hauteur (ratio portrait pour le style "carte") */}
        <div className="relative aspect-[4/5] w-full">
          {coverPhotoUrl ? (
            <img
              src={coverPhotoUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 h-full w-full bg-zinc-800" />
          )}

          {/* Le fameux dégradé noir profond pour assurer la lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
        </div>

        {/* Badge "Type de bien" en haut à gauche */}
        <div className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
          {propertyType}
        </div>

        {/* Contenu textuel positionné par-dessus le dégradé */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-5">
          
          {/* Titre et Localisation */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="line-clamp-1 text-2xl font-bold tracking-tight text-white">
              {title}
            </h2>
          </div>
          
          {publicAreaLabel && (
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
              <MapPin className="h-4 w-4 text-blue-400" />
              {publicAreaLabel}
            </p>
          )}

          {/* Description courte */}
          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-100">
            {shortDescription}
          </p>

          {/* La rangée de métriques séparée par des lignes (comme sur le screenshot) */}
          <div className="mb-6 flex items-center justify-between px-2">
            {/* Colonne Voyageurs */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                <Users className="h-4 w-4 text-orange-400" />
                {maxGuests}
              </div>
              {/* <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Voyageurs
              </span> */}
            </div>

            {/* Séparateur */}
            <div className="h-8 w-px bg-white/10" />

            {/* Colonne Chambres */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                <BedDouble className="h-4 w-4 text-orange-400" />
                {bedroomCount || '-'}
              </div>
              {/* <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Chambres
              </span> */}
            </div>

            {/* Séparateur */}
            <div className="h-8 w-px bg-white/10" />

            {/* Colonne Équipements */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                <Sparkles className="h-4 w-4 text-orange-400" />
                {amenities.length}
              </div>
              {/* <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Services
              </span> */}
            </div>
          </div>

          {/* Bouton d'action "Get in touch" adapté */}
          <div className="flex items-center justify-between rounded-[1rem] bg-white/10 p-1.5 pl-5 backdrop-blur-md transition-colors hover:bg-white/20 border border-white/5">
            <span className="text-sm font-semibold text-white">
              Découvrir le logement
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>

        </div>
      </Link>
    </article>
  )
}