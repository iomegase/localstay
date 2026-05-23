// src/features/auth/lib/subscription.ts
import { prisma } from '@/shared/lib/prisma'

export async function createTrialSubscription(userId: string): Promise<void> {
  const trialEndsAt = new Date()
  trialEndsAt.setFullYear(trialEndsAt.getFullYear() + 1)

  await prisma.subscription.create({
    data: {
      user_id: userId,
      plan: 'free',
      status: 'trial',
      trial_ends_at: trialEndsAt,
    },
  })
}
