import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingBrand } from '@/features/marketing/components/MarketingHeader'
import {
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/marketing-styles'

export const metadata: Metadata = {
  title: 'Page introuvable',
}

const LINKS = [
  { href: '/', label: 'Accueil', copy: 'La conciergerie MyStay au Pays du Mont-Blanc.' },
  { href: '/logements', label: 'Nos logements', copy: 'Chalets et appartements accompagnés par MyStay.' },
  { href: '/decouvrir', label: 'Découvrir', copy: 'Nos bonnes adresses autour de Saint-Gervais.' },
  { href: '/journal', label: 'Journal', copy: 'Guides locaux et conseils de séjour.' },
] as const

/**
 * 404 du site (audit SEO/GEO 2026-10-05) : URL inconnues et `notFound()` hors
 * du guide. Volontairement légère : Next.js la pré-rend dans le payload de
 * chaque page, elle n'embarque donc ni en-tête/footer complets ni requête.
 * Next.js pose le statut 404 et `noindex`.
 */
export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-white text-slate-800">
      <div className={`${marketingContainerClass} pb-20 pt-8 sm:pb-28 sm:pt-10`}>
        <MarketingBrand />
        <p className="mt-14 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500 sm:mt-20">
          Erreur 404
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-slate-900 sm:text-6xl">
          Cette page est introuvable.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
          Le lien est peut-être incomplet, ou la page a été déplacée. Vous séjournez dans un logement
          MyStay ? Ouvrez le lien personnel ou le QR code transmis par votre hôte.
        </p>

        <ul data-testid="not-found-links" className="mt-10 grid gap-3 sm:grid-cols-2">
          {LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex h-full items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-6 py-5 transition-colors hover:border-pink-600"
              >
                <span>
                  <span className="block text-[15px] font-semibold text-slate-800">{link.label}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-slate-500">{link.copy}</span>
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600 transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/confier-mon-logement" className={`${marketingPrimaryButtonClass} mt-10`}>
          Nous contacter
        </Link>
      </div>
    </main>
  )
}
