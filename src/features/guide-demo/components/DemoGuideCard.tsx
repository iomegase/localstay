import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Design unique des cartes du guide logement de démonstration (AC-01-12). */
export const DEMO_GUIDE_CARD =
  'rounded-[26px] bg-indigo-950 px-5 py-4 text-white shadow-[0_10px_24px_rgba(30,27,75,0.22)]'

/** Couleurs atténuées des pastilles rondes. */
export const DEMO_PASTILLE = {
  wifi: 'bg-[#5b7fc4]',
  emergency: 'bg-[#b4472b]',
  phone: 'bg-[#5b5bd6]',
  location: 'bg-[#3f8f6f]',
  step: 'bg-[#c2457e]',
  equipment: 'bg-[#5b5bd6]',
  rules: 'bg-[#8a63c7]',
  checklist: 'bg-[#5b7fc4]',
} as const

export type DemoPastilleTone = keyof typeof DEMO_PASTILLE

/** Titre de section masqué à l'écran, conservé pour les lecteurs d'écran (AC-01-13). */
export function DemoSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="sr-only">{children}</h2>
}

/** Ligne d'en-tête d'une carte : pastille ronde, titre, sous-titre, élément à droite. */
export function DemoCardHeading({
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
  tone: DemoPastilleTone
  title: ReactNode
  hint?: ReactNode
  trailing?: ReactNode
  as?: 'span' | 'h2' | 'h3'
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <span
          data-testid={step === undefined ? undefined : 'demo-arrival-step'}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${DEMO_PASTILLE[tone]}`}
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

/** Carte simple : en-tête seul (numéros, poubelles, localisation…). */
export function DemoInfoCard({
  testId,
  ...heading
}: Parameters<typeof DemoCardHeading>[0] & { testId: string }) {
  return (
    <div data-testid={testId} data-demo-card="true" className={DEMO_GUIDE_CARD}>
      <DemoCardHeading {...heading} />
    </div>
  )
}
