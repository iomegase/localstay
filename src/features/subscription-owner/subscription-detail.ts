const DAY_IN_MS = 24 * 60 * 60 * 1000

export function calculateDaysRemaining(trialEndsAt: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_IN_MS))
}

export function formatTrialDate(trialEndsAt: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(trialEndsAt)
}

export function buildTrialMessage(trialEndsAt: Date, now = new Date()): string {
  const daysRemaining = calculateDaysRemaining(trialEndsAt, now)
  return `Gratuit jusqu’au ${formatTrialDate(trialEndsAt)} · ${daysRemaining} jours restants`
}
