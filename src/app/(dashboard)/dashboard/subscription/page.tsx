import { CreditCard, ShieldCheck, CalendarDays } from 'lucide-react'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { getOwnerSubscriptionDetail } from '@/features/subscription-owner/queries/subscription'
import { OWNER_PLAN_CATALOG } from '@/features/subscription-owner/plans'
import { buildTrialMessage, formatTrialDate } from '@/features/subscription-owner/subscription-detail'
import { SubscriptionPlanGrid } from '@/features/subscription-owner/components/SubscriptionPlanGrid'

export default async function SubscriptionPage() {
  const owner = await getPageOwner()
  const subscription = await getOwnerSubscriptionDetail(owner.id)
  const trialEndsAt = new Date(subscription.trial_ends_at)
  const progress = Math.min(100, Math.round(((365 - subscription.days_remaining) / 365) * 100))

  return (
    <div className="w-full animate-in fade-in space-y-6 duration-500">
      {/* Header card */}
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Abonnement
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Votre formule
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Période d&apos;essai gratuite, plans envisagés et fonctionnalités incluses. Aucune facturation déclenchée pour le moment.
          </p>
        </div>

        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-emerald-100/60 bg-emerald-50/80 px-4 text-[11px] font-bold uppercase tracking-widest text-emerald-600">
          <ShieldCheck size={14} />
          Période d&apos;essai
        </span>
      </header>

      {/* Plan actif card */}
      <section className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F8] text-[#0B1437]">
                <CreditCard size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Plan actif</h2>
                <p className="text-xs text-gray-500">{buildTrialMessage(trialEndsAt)}</p>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              {subscription.features.map(feature => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B1437]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 md:max-w-sm">
            <div className="rounded-[20px] border border-gray-100 bg-gray-50/50 p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                <CalendarDays size={14} />
                Jours restants
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-neutral-900">
                  {subscription.days_remaining}
                </span>
                <span className="text-sm text-gray-400">/ 365</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#0B1437] transition-all"
                  style={{ width: `${progress}%` }}
                  aria-label="Progression de la période gratuite"
                />
              </div>
              <p className="mt-4 text-[11px] text-gray-500">
                Accès gratuit jusqu&apos;au{' '}
                <span className="font-semibold text-neutral-900">{formatTrialDate(trialEndsAt)}</span>
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#0B1437]/60 px-6 text-[13px] font-bold text-white opacity-80"
            >
              Gérer ma facturation
              <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                Bientôt
              </span>
            </button>
          </div>
        </div>
      </section>

      <SubscriptionPlanGrid plans={OWNER_PLAN_CATALOG} trialEndsAt={formatTrialDate(trialEndsAt)} />
    </div>
  )
}
