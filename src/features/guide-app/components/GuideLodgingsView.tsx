import { LodgingCard } from '@/features/lodging-showcase/components/LodgingCard'
import type { GuideLodgingCard } from '@/features/guide-app/types'

/**
 * Vue « Tous nos logements » rendue DANS l'app (guest confiné). Réutilise la
 * carte publique `LodgingCard` mais SANS lien (`href` absent) : purement
 * présentative, aucune sortie vers le site public — sinon perte d'accès au guide.
 */
export function GuideLodgingsView({ lodgings }: { lodgings: GuideLodgingCard[] }) {
  return (
    <div className="px-3 pb-24 pt-5">
      <h1 className="px-2 text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900">
        Nos logements
      </h1>

      {lodgings.length > 0 ? (
        <div className="mt-6 space-y-5">
          {lodgings.map(lodging => (
            <LodgingCard
              key={lodging.id}
              title={lodging.title}
              coverPhotoUrl={lodging.coverPhotoUrl}
              shortDescription={lodging.shortDescription}
              propertyType={lodging.propertyType}
              maxGuests={lodging.maxGuests}
              bedroomCount={lodging.bedroomCount}
              publicAreaLabel={lodging.publicAreaLabel ?? lodging.cityName}
              amenities={lodging.amenities}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 px-2 text-sm leading-6 text-slate-500">
          Aucun logement public n’est disponible pour le moment.
        </p>
      )}
    </div>
  )
}
