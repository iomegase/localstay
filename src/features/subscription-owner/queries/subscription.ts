import { prisma } from '@/shared/lib/prisma'
import { calculateDaysRemaining } from '@/features/subscription-owner/subscription-detail'
import { getOwnerPlanFeatures } from '@/features/subscription-owner/plans'

export type SubscriptionDetail = {
  plan: string
  status: string
  trial_ends_at: string
  days_remaining: number
  features: string[]
}

export async function getOwnerSubscriptionDetail(ownerId: string): Promise<SubscriptionDetail> {
  const subscription = await prisma.subscription.findFirst({
    where: { user_id: ownerId, deleted_at: null },
    orderBy: { created_at: 'desc' },
    select: {
      plan: true,
      status: true,
      trial_ends_at: true,
    },
  })

  if (!subscription) {
    throw new Error('SUBSCRIPTION_NOT_FOUND')
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    trial_ends_at: subscription.trial_ends_at.toISOString(),
    days_remaining: calculateDaysRemaining(subscription.trial_ends_at),
    features: getOwnerPlanFeatures(subscription.plan),
  }
}

export async function expirePastDueTrials(now = new Date()): Promise<{ count: number }> {
  return prisma.subscription.updateMany({
    where: {
      deleted_at: null,
      status: 'trial',
      trial_ends_at: { lt: now },
    },
    data: { status: 'past_due' },
  })
}
