import { CreditCard } from 'lucide-react'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { getOwnerSubscriptionDetail } from '@/features/subscription-owner/queries/subscription'
import { OWNER_PLAN_CATALOG } from '@/features/subscription-owner/plans'
import { buildTrialMessage, formatTrialDate } from '@/features/subscription-owner/subscription-detail'
import { SubscriptionPlanGrid } from '@/features/subscription-owner/components/SubscriptionPlanGrid'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export default async function SubscriptionPage() {
  const owner = await getPageOwner()
  const subscription = await getOwnerSubscriptionDetail(owner.id)
  const trialEndsAt = new Date(subscription.trial_ends_at)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif italic text-2xl text-foreground">Abonnement</h1>
        <p className="text-muted-foreground">Votre période gratuite et les plans Owner envisagés.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan actif
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{buildTrialMessage(trialEndsAt)}</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Trial</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Jours restants</span>
              <span>{subscription.days_remaining} / 365</span>
            </div>
            <progress
              className="h-2 w-full overflow-hidden rounded-full accent-primary"
              value={365 - subscription.days_remaining}
              max={365}
              aria-label="Progression de la période gratuite"
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="font-medium">Votre accès gratuit se termine le {formatTrialDate(trialEndsAt)}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {subscription.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>

          <Button type="button" disabled>
            Gérer ma facturation
          </Button>
        </CardContent>
      </Card>

      <SubscriptionPlanGrid plans={OWNER_PLAN_CATALOG} trialEndsAt={formatTrialDate(trialEndsAt)} />
    </div>
  )
}
