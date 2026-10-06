import { localSeoPath } from './paths'
import type { LandingContentIssue, LocalLandingIntent, LocalLandingPageInput, LocalSeoIntent } from '../types/landing-pages'

// Spec 076 : modèle de l'éditeur admin des landings (onglets, blocs, contrôles).

export const LANDING_TABS = [
  { key: 'conciergerie', label: 'Conciergerie', intent: 'CONCIERGE' },
  { key: 'seminaires', label: 'Séminaires', intent: 'SEMINAR' },
  { key: 'locations', label: 'Locations de vacances', intent: 'VACATION_RENTAL' },
  { key: 'avis', label: 'Avis', intent: null },
] as const

export type LandingTabKey = (typeof LANDING_TABS)[number]['key']

export function tabFromParam(value: string | null | undefined): LandingTabKey {
  return LANDING_TABS.find(tab => tab.key === value)?.key ?? 'conciergerie'
}

export function tabForIntent(intent: LocalLandingIntent): LandingTabKey {
  return LANDING_TABS.find(tab => tab.intent === intent)!.key
}

type ScalarField = Exclude<keyof LocalLandingPageInput, 'intent' | 'highlights' | 'steps' | 'faq'>

export type EditorField = {
  field: ScalarField
  label: string
  maxLength: number
  multiline: boolean
  /** Longueur recommandée pour Google (compteur). */
  recommended?: number
  hint?: string
}

export type EditorBlock = {
  id: string
  title: string
  description: string
  fields: EditorField[]
  repeatable?: 'highlights' | 'steps' | 'faq'
}

const line = (field: ScalarField, label: string, maxLength: number, extra: Partial<EditorField> = {}): EditorField =>
  ({ field, label, maxLength, multiline: false, ...extra })
const text = (field: ScalarField, label: string, maxLength = 2000, extra: Partial<EditorField> = {}): EditorField =>
  ({ field, label, maxLength, multiline: true, ...extra })

export function blocksForIntent(intent: LocalLandingIntent): EditorBlock[] {
  const blocks: EditorBlock[] = [
    {
      id: 'seo', title: 'Référencement', description: 'Ce qui s’affiche dans les résultats Google.',
      fields: [
        line('seo_title', 'Titre SEO', 180, { recommended: 60 }),
        text('meta_description', 'Description SEO', 320, { recommended: 160 }),
      ],
    },
    {
      id: 'hero', title: 'Bandeau', description: 'Le haut de la page.',
      fields: [
        line('eyebrow', 'Surtitre', 100),
        line('h1', 'Titre principal (H1)', 180),
        line('hero_title', 'Accroche', 240, { hint: 'Masquée si identique au titre principal.' }),
        text('hero_copy', 'Texte du bandeau'),
        line('reassurance', 'Réassurance', 300, { hint: 'Optionnel. Séparez les éléments par « · ».' }),
      ],
    },
    {
      id: 'section', title: 'Section principale', description: 'Présentation et points forts.',
      fields: [line('section_title', 'Titre de section', 240), text('section_copy', 'Texte de section')],
      repeatable: 'highlights',
    },
    {
      id: 'steps', title: 'Étapes', description: 'Le déroulé, étape par étape.',
      fields: [line('process_title', 'Titre des étapes', 240, { hint: 'Optionnel.' })],
      repeatable: 'steps',
    },
    {
      id: 'local', title: 'Ancrage local', description: 'Ce qui rend la ville particulière.',
      fields: [line('local_title', 'Titre local', 240), text('local_copy', 'Texte local')],
    },
    {
      id: 'cta', title: 'Appel à l’action', description: 'Le bouton principal de la page.',
      fields: [line('cta_label', 'Libellé du bouton', 120), line('cta_href', 'Lien du bouton', 500, { hint: 'Chemin du site, ex. /confier-mon-logement.' })],
    },
  ]
  if (intent === 'VACATION_RENTAL') {
    blocks.push({
      id: 'empty', title: 'Sans logement', description: 'Affiché quand aucun logement n’est publié dans la ville.',
      fields: [text('empty_copy', 'Texte sans logement', 2000, { hint: 'Optionnel.' })],
    })
  }
  blocks.push({ id: 'faq', title: 'FAQ', description: 'Questions fréquentes (reprises dans Google).', fields: [], repeatable: 'faq' })
  return blocks
}

export function seoLength(value: string, recommended: number): { length: number; over: boolean } {
  return { length: value.length, over: value.length > recommended }
}

const SEO_INTENTS: Record<LocalLandingIntent, LocalSeoIntent> = {
  CONCIERGE: 'concierge',
  SEMINAR: 'seminar',
  VACATION_RENTAL: 'vacation-rental',
}

export function landingPublicPath(intent: LocalLandingIntent, citySlug: string): string {
  return localSeoPath(SEO_INTENTS[intent], citySlug)
}

/** Spec 076 AC-02-05 : chemins des champs à compléter pour une page. */
export function fieldIssues(issues: LandingContentIssue[], intent: LocalLandingIntent): Set<string> {
  return new Set(issues.filter(issue => issue.intent === intent).map(issue => issue.field))
}

export function issueCountByIntent(issues: LandingContentIssue[]): Record<LocalLandingIntent, number> {
  return {
    CONCIERGE: fieldIssues(issues, 'CONCIERGE').size,
    SEMINAR: fieldIssues(issues, 'SEMINAR').size,
    VACATION_RENTAL: fieldIssues(issues, 'VACATION_RENTAL').size,
  }
}

export function isLandingDraftDirty(saved: LocalLandingPageInput[], draft: LocalLandingPageInput[]): boolean {
  return JSON.stringify(saved) !== JSON.stringify(draft)
}
