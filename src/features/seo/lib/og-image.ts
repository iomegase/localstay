import { SITE } from './site'

/** Dimensions standard d'une image Open Graph (ratio 1.91:1, attendu par les crawlers sociaux). */
export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

const MAX_TITLE = 60
const MAX_SUBTITLE = 160

export interface OgCard {
  eyebrow: string
  title: string
  subtitle: string
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

/**
 * Modèle texte d'une carte OG générée (marque + titre + accroche).
 * Pur et testable : la génération PNG (ImageResponse) n'est qu'une glue par-dessus.
 */
export function ogCard(input: { title?: string | null; subtitle?: string | null }): OgCard {
  const title = (input.title ?? '').trim() || SITE.name
  const subtitle = (input.subtitle ?? '').trim() || SITE.defaultDescription
  return {
    eyebrow: SITE.name,
    title: clamp(title, MAX_TITLE),
    subtitle: clamp(subtitle, MAX_SUBTITLE),
  }
}
