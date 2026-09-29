import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * Design de carte du livret privé, dupliqué de la démo (spec 050 BR-01) :
 * doit rester strictement identique à `DEMO_GUIDE_CARD`.
 */
export const GUIDE_CARD =
  'rounded-[26px] bg-indigo-950 px-5 py-4 text-white shadow-[0_10px_24px_rgba(30,27,75,0.22)]'

/** Couleurs atténuées des pastilles rondes (identiques à la démo). */
export const GUIDE_PASTILLE = {
  wifi: 'bg-[#5b7fc4]',
  emergency: 'bg-[#b4472b]',
  phone: 'bg-[#5b5bd6]',
  location: 'bg-[#3f8f6f]',
  step: 'bg-[#c2457e]',
  equipment: 'bg-[#5b5bd6]',
  rules: 'bg-[#8a63c7]',
  checklist: 'bg-[#5b7fc4]',
} as const

export type GuidePastilleTone = keyof typeof GUIDE_PASTILLE

/** Titre de section masqué à l'écran, conservé pour les lecteurs d'écran. */
export function GuideSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="sr-only">{children}</h2>
}

/** Ligne d'en-tête d'une carte : pastille ronde, titre, sous-titre, élément à droite. */
export function GuideCardHeading({
  icon: Icon,
  step,
  tone,
  title,
  hint,
  trailing,
  as: Heading = 'span',
}: {
  icon?: LucideIcon
  step?: number
  tone: GuidePastilleTone
  title: ReactNode
  hint?: ReactNode
  trailing?: ReactNode
  as?: 'span' | 'h2' | 'h3'
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <span
          data-testid={step === undefined ? undefined : 'guide-step'}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${GUIDE_PASTILLE[tone]}`}
        >
          {step === undefined && Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : step}
        </span>
        <span className="min-w-0">
          <Heading className="block text-sm font-semibold">{title}</Heading>
          {hint ? (
            <span className="mt-0.5 block text-[10px] text-white/60">{hint}</span>
          ) : null}
        </span>
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  )
}

/** Carte simple (en-tête seul) ; devient un lien quand `href` est fourni. */
export function GuideInfoCard({
  testId,
  href,
  external = false,
  ...heading
}: Parameters<typeof GuideCardHeading>[0] & {
  testId: string
  href?: string
  external?: boolean
}) {
  if (href) {
    return (
      <a
        data-testid={testId}
        data-guide-card="true"
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className={`${GUIDE_CARD} block transition-transform active:scale-[0.99]`}
      >
        <GuideCardHeading {...heading} />
      </a>
    )
  }

  return (
    <div data-testid={testId} data-guide-card="true" className={GUIDE_CARD}>
      <GuideCardHeading {...heading} />
    </div>
  )
}
