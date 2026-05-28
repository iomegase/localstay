import Link from 'next/link'
import { Mail, MessageCircle, PhoneCall } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { LeaveStayButton } from '@/features/public-menu/components/LeaveStayButton'

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
    <div className="px-5 pt-4">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Contact</p>
        <h1 className="mt-1 font-serif italic text-3xl text-charcoal">Une question ?</h1>
        <p className="mt-2 text-sm text-gray-500">
          MyStay accompagne les hôtes et leurs voyageurs en Haute-Savoie.
        </p>
      </div>
      <ContactCard
        icon={<Mail className="h-5 w-5" />}
        title="Écrivez-nous"
        subtitle="Réponse sous 48h"
        href="mailto:hello@mystay.fr"
        cta="hello@mystay.fr"
      />
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
        <p className="font-semibold text-charcoal">Vous êtes propriétaire / hôte ?</p>
        <p className="mt-1">
          Créez votre guide personnalisé pour vos voyageurs depuis votre espace dédié.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-flex items-center justify-center rounded-full border border-charcoal px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-white"
        >
          Espace hôte
        </Link>
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
  lodgingContext: { lodgingName: string; cityName: string; citySlug: string }
  ownerInfo: OwnerInfo
}) {
  return (
    <div className="px-5 pt-4">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Nous contacter</p>
        <h1 className="mt-1 font-serif italic text-3xl text-charcoal">Votre hôte</h1>
        <p className="mt-1 text-sm text-gray-500">{lodgingContext.lodgingName} · {lodgingContext.cityName}</p>
      </div>

      {ownerInfo?.ownerEmail && (
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          title={ownerInfo.ownerName ?? 'Votre hôte'}
          subtitle="Envoyer un email"
          href={`mailto:${ownerInfo.ownerEmail}`}
          cta={ownerInfo.ownerEmail}
        />
      )}

      {ownerInfo?.emergency_contacts && (
        <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-charcoal">
            <PhoneCall className="h-4 w-4 text-red-500" />
            <h2 className="font-serif italic text-base">Urgences</h2>
          </div>
          <MarkdownText
            source={ownerInfo.emergency_contacts}
            className="text-sm leading-relaxed text-charcoal/70"
          />
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
        <div className="flex items-center gap-2 text-charcoal">
          <MessageCircle className="h-4 w-4" />
          <p className="font-semibold">Équipe MyStay</p>
        </div>
        <p className="mt-2">
          Une question liée à l&apos;application elle-même ? Écrivez à <a className="text-charcoal underline" href="mailto:hello@mystay.fr">hello@mystay.fr</a>.
        </p>
      </section>

      <div className="mt-8 flex justify-center">
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
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  href: string
  cta: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-serif italic text-base text-charcoal">{title}</p>
        <p className="text-[11px] uppercase tracking-widest text-gray-400">{subtitle}</p>
        <p className="mt-1 text-sm text-charcoal/80">{cta}</p>
      </div>
    </a>
  )
}

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
