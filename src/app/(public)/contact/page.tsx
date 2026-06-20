import Link from 'next/link'
import { Mail, MessageCircle, PhoneCall, ArrowRight } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { LeaveStayButton } from '@/features/public-menu/components/LeaveStayButton'
import { ContactMessageForm } from '@/features/contact-messages/components/ContactMessageForm'

export default async function ContactPage() {
  const lodgingContext = await getActiveLodgingContext()

  if (lodgingContext) {
    const ownerInfo = await getOwnerContactInfo(lodgingContext.lodgingId)
    return <LodgingContact lodgingContext={lodgingContext} ownerInfo={ownerInfo} />
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

type OwnerInfo = {
  emergency_contacts: string | null
  ownerName: string | null
  ownerEmail: string | null
} | null

function LodgingContact({
  lodgingContext,
  ownerInfo,
}: {
  lodgingContext: { lodgingId: string; lodgingName: string; cityName: string; citySlug: string }
  ownerInfo: OwnerInfo
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

      {/* Bouton Email direct (Card Modernisée) */}
      {ownerInfo?.ownerEmail && (
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          title={ownerInfo.ownerName ?? 'Votre hôte'}
          subtitle="Contacter par email"
          href={`mailto:${ownerInfo.ownerEmail}`}
          cta={ownerInfo.ownerEmail}
          analyticsEvent="owner_email_click"
          analyticsCitySlug={lodgingContext.citySlug}
          analyticsLodgingId={lodgingContext.lodgingId}
        />
      )}

      {/* Bloc Urgences (Refonte avec couleurs douces mais distinctives) */}
      {ownerInfo?.emergency_contacts && (
        <section className="rounded-[24px] bg-rose-50/50 border border-rose-100 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <PhoneCall className="h-5 w-5" />
            </span>
            <h2 className="font-serif text-[20px] font-medium text-gray-900">Urgences</h2>
          </div>
          {/* Prose ajouté pour forcer un style élégant au markdown */}
          <div className="prose prose-sm prose-rose text-[14px] leading-relaxed text-gray-700">
            <MarkdownText source={ownerInfo.emergency_contacts} />
          </div>
        </section>
      )}

      {/* Support MyStay (Bloc minimaliste) */}
      <section className="rounded-[24px] bg-gray-50 border border-gray-100 p-6 text-center flex flex-col items-center">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 text-gray-400">
          <MessageCircle className="h-5 w-5" />
        </div>
        <p className="font-medium text-[#111827] text-[15px] mb-1">Équipe MyStay</p>
        <p className="text-[13px] text-gray-500">
          Un souci technique avec l'application ?<br/>
          <a
            className="text-[#5A6B5D] font-medium hover:underline mt-1 inline-block"
            href="mailto:hello@mystay.fr"
            data-analytics-event="mystay_email_click"
            data-analytics-city-slug={lodgingContext.citySlug}
            data-analytics-lodging-id={lodgingContext.lodgingId}
          >
            hello@mystay.fr
          </a>
        </p>
      </section>

      {/* Bouton Quitter (Aéré et centré) */}
      <div className="pt-4 flex justify-center opacity-80 hover:opacity-100 transition-opacity">
        <LeaveStayButton />
      </div>
    </div>
  )
}

function ContactCard({
  icon,
  title,
  subtitle,
  href,
  cta,
  analyticsEvent,
  analyticsCitySlug,
  analyticsLodgingId,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  href: string
  cta: string
  analyticsEvent?: 'owner_email_click' | 'mystay_email_click'
  analyticsCitySlug?: string | null
  analyticsLodgingId?: string | null
}) {
  return (
    <a
      href={href}
      data-analytics-event={analyticsEvent}
      data-analytics-city-slug={analyticsCitySlug ?? undefined}
      data-analytics-lodging-id={analyticsLodgingId ?? undefined}
      className="group flex items-center gap-4 rounded-[24px] bg-white p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-gray-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] active:scale-[0.98]"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-[#111827] group-hover:text-white">
        {icon}
      </span>
      <div className="flex-1 overflow-hidden">
        <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">
          {subtitle}
        </p>
        <p className="font-serif text-[18px] font-medium text-[#111827] truncate">
          {title}
        </p>
        <p className="mt-1 text-[13px] text-gray-500 truncate group-hover:text-[#5A6B5D] transition-colors">
          {cta}
        </p>
      </div>
    </a>
  )
}

// LOGIQUE DATA INTACTE
async function getOwnerContactInfo(lodgingId: string): Promise<OwnerInfo> {
  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null },
    select: {
      owner: { select: { first_name: true, last_name: true, email: true } },
      customization: { select: { emergency_contacts: true } },
    },
  })
  if (!lodging) return null
  const parts = [lodging.owner.first_name, lodging.owner.last_name].filter((p): p is string => Boolean(p))
  return {
    emergency_contacts: lodging.customization?.emergency_contacts ?? null,
    ownerName: parts.length > 0 ? parts.join(' ') : null,
    ownerEmail: lodging.owner.email,
  }
}
