import type { Metadata } from 'next'
import { NotFoundScene } from '@/features/marketing/components/NotFoundScene'

export const metadata: Metadata = {
  title: 'Page introuvable',
}

/**
 * 404 du site : URL inconnues et `notFound()` hors du guide. Reste un Server
 * Component pour conserver le titre ; la scène animée (GSAP) est cliente.
 * Next.js pose le statut 404 et `noindex`.
 */
export default function NotFound() {
  return <NotFoundScene />
}
