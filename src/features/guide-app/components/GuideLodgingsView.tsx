import { GuideLodgingListCard } from '@/features/guide-app/components/GuideLodgingListCard'
import type { GuideLodgingCard } from '@/features/guide-app/types'

/**
 * Vue « Tous nos logements » rendue DANS l'app (guest confiné). Cartes carrées
 * dédiées (GuideLodgingListCard), purement présentatives — aucun lien sortant
 * vers le site public (sinon perte d'accès au guide). Le clic ouvre le détail interne.
 */
export function GuideLodgingsView({
  lodgings,
  onOpen,
}: {
  lodgings: GuideLodgingCard[]
  onOpen: (lodging: GuideLodgingCard) => void
}) {
  return (
    <div className="px-3 pb-24 pt-5">
      <h1 className="px-2 text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900">
        Nos logements
      </h1>

      {lodgings.length > 0 ? (
        <div className="mt-6 space-y-5">
          {lodgings.map(lodging => (
            <button
              key={lodging.id}
              type="button"
              onClick={() => onOpen(lodging)}
              aria-label={`Voir ${lodging.title}`}
              className="block w-full text-left"
            >
              <GuideLodgingListCard lodging={lodging} />
            </button>
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
