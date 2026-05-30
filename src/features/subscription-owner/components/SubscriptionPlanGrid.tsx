'use client'

import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import type { OwnerPlanDisplay } from '@/features/subscription-owner/plans'

type SubscriptionPlanGridProps = {
  plans: OwnerPlanDisplay[]
  trialEndsAt: string
}

export function SubscriptionPlanGrid({ plans, trialEndsAt }: SubscriptionPlanGridProps) {
  return (
    <section className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Plans disponibles
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
            Formules envisagées
          </h2>
        </div>
        <span className="text-[11px] text-gray-400">Prix indicatifs non contractuels</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map(plan => {
          const isHighlighted = plan.slug !== 'discovery'

          return (
            <div
              key={plan.slug}
              className={`flex flex-col rounded-[20px] border p-6 shadow-sm transition-all hover:shadow-md ${
                isHighlighted
                  ? 'border-[#0B1437]/15 bg-[#F4F7FE]/40'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="border-b border-gray-100/80 pb-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {plan.name}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
                  {plan.price_label}
                </p>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-gray-600">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={14} className="mt-1 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-[13px] font-bold transition-all ${
                      isHighlighted
                        ? 'bg-[#0B1437] text-white shadow-sm hover:bg-gray-900 hover:shadow-md'
                        : 'border border-gray-200 bg-white text-[#0B1437] hover:border-[#0B1437]/30 hover:bg-gray-50'
                    }`}
                  >
                    Choisir ce plan
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{plan.name} sélectionné</DialogTitle>
                    <DialogDescription>
                      La facturation démarrera seulement à la fin de votre période gratuite du {trialEndsAt}.
                      Aucun paiement immédiat n&apos;est déclenché en MVP 2.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          )
        })}
      </div>
    </section>
  )
}
