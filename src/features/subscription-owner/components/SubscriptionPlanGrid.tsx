"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import type { OwnerPlanDisplay } from '@/features/subscription-owner/plans'

type SubscriptionPlanGridProps = {
  plans: OwnerPlanDisplay[]
  trialEndsAt: string
}

export function SubscriptionPlanGrid({ plans, trialEndsAt }: SubscriptionPlanGridProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Plans disponibles</h2>
        <p className="text-sm text-muted-foreground">Prix indicatifs non contractuels</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.slug} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-bold">{plan.price_label}</p>
              <p className="text-xs text-muted-foreground">Prix indicatif non contractuel</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant={plan.slug === 'discovery' ? 'secondary' : 'default'} className="w-full">
                    Choisir ce plan
                  </Button>
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
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
