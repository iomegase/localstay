import type { Metadata } from 'next'
import { ContactMessageForm } from '@/features/contact-messages/components/ContactMessageForm'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'
import { requireActiveLodgingContext } from '@/features/public-menu/lib/private-stay-guard'

export const metadata: Metadata = privatePageMetadata('Contact')

export default async function ContactPage() {
  const lodgingContext = await requireActiveLodgingContext()
  return <LodgingContact lodgingContext={lodgingContext} />
}

function LodgingContact({
  lodgingContext,
}: {
  lodgingContext: { lodgingId: string; lodgingName: string; cityName: string; citySlug: string }
}) {
  return (
    <div className="px-6 pt-8 pb-24 max-w-md mx-auto space-y-8">
      {/* En-tête */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Assistance
        </p>
        <h1 className="font-serif text-[34px] font-medium leading-tight text-[#111827]">
          Votre hôte
        </h1>
        {/* Affichage du lieu façon "Pilule" élégante */}
        <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="w-2 h-2 rounded-full bg-[#5A6B5D]"></span>
          <span className="text-[13px] font-medium text-gray-600">
            {lodgingContext.lodgingName} <span className="text-gray-300 mx-1">|</span> {lodgingContext.cityName}
          </span>
        </div>
      </div>

      {/* Formulaire natif */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/80">
        <ContactMessageForm
          lodgingId={lodgingContext.lodgingId}
          lodgingName={lodgingContext.lodgingName}
          allowOwnerDestination
        />
      </div>
    </div>
  )
}
