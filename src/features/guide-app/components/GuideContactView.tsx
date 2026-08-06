import { ContactMessageForm } from '@/features/contact-messages/components/ContactMessageForm'

export type GuideContactInfo = {
  lodgingId: string
  lodgingName: string
  cityName: string
}

/**
 * Vue « Nous contacter » rendue DANS l'app (guest confiné). Reprend le design de
 * la page contact publique (variante séjour : « Votre hôte ») et réutilise le
 * même ContactMessageForm — aucune sortie vers le site public.
 */
export function GuideContactView({ contact }: { contact: GuideContactInfo }) {
  return (
    <div className="mx-auto max-w-md space-y-8 px-6 pb-24 pt-8">
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Assistance
        </p>
        <h1 className="font-serif text-[34px] font-medium leading-tight text-[#111827]">
          Votre hôte
        </h1>
        {/* Pilule élégante : logement | ville */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="h-2 w-2 rounded-full bg-[#5A6B5D]" />
          <span className="text-[13px] font-medium text-gray-600">
            {contact.lodgingName}
            <span className="mx-1 text-gray-300">|</span>
            {contact.cityName}
          </span>
        </div>
      </div>

      <div className="rounded-[24px] border border-gray-100/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <ContactMessageForm
          lodgingId={contact.lodgingId}
          lodgingName={contact.lodgingName}
          allowOwnerDestination
        />
      </div>
    </div>
  )
}
