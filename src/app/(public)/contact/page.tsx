import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { ContactMessageForm } from '@/features/contact-messages/components/ContactMessageForm'

export default async function ContactPage() {
  const lodgingContext = await getActiveLodgingContext()

  if (lodgingContext) {
    return <LodgingContact lodgingContext={lodgingContext} />
  }

  return <PublicContact />
}

function PublicContact() {
  return (
    <div className="px-6 pt-8 pb-24 max-w-md mx-auto">
      {/* En-tête */}
      <div className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Contact
        </p>
        <h1 className="uppercase text-[34px] font-light leading-tight text-[#111827]">
          Une question ?
        </h1>
        <p className="mt-3 text-[12px] leading-relaxed text-gray-500">
          MyStay accompagne les hôtes et leurs voyageurs en Haute-Savoie pour des séjours inoubliables.
        </p>
      </div>


      <div className="mb-12">
        <ContactMessageForm
          lodgingId={null}
          lodgingName={null}
          allowOwnerDestination={false}
        />
      </div>

      {/* Encart Call-to-Action Hôte (Style Premium) */}
      <div className="rounded-md bg-[#5A6B5D]/5 p-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <p className="uppercase text-[22px] font-thin tracking-wider text-[#111827] mb-2">
            Vous êtes hôte ?
          </p>
          <p className="text-[13px] text-gray-600 mb-6 leading-relaxed px-2">
            Créez un guide local digital, élégant et personnalisé pour vos voyageurs.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex uppercase tracking-wider items-center justify-center gap-2 rounded-md bg-[#111827] px-6 py-3.5 text-[12px] font-medium text-white transition-transform hover:scale-105 active:scale-95"
          >
            Espace hôte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
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
