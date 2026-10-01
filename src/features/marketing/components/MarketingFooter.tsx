import Link from 'next/link'
import { HelpContactDialog } from '@/features/contact-messages/components/HelpContactDialog'
import { MarketingBrand } from './MarketingHeader'
import { marketingContainerClass } from './marketing-styles'
import { FooterDestinations } from './FooterDestinations'

// Cibles tactiles d'au moins 32 px (spec 031 AC-01-10 (7)).
const footerLinkClass = 'inline-flex min-h-8 items-center text-left transition-colors hover:text-white'

export function MarketingFooter() {
  return (
    <footer className="bg-slate-800 pb-7 pt-16 text-white sm:pt-20 xl:mt-[clamp(56px,7vw,80px)] xl:pt-[54px]">
      <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-[1.4fr_2fr]`}>
        <div>
          <MarketingBrand light />
          <p className="mt-5 max-w-xs text-xs leading-6 text-slate-400">
            La conciergerie locale qui prend soin des logements et accueille chaque voyageur avec
            attention.
          </p>
          {/* Icônes réseaux sociaux masquées tant que les comptes ne sont pas prêts (spec 031 AC-01-10 (7)). */}
        </div>

        <div data-testid="marketing-footer-columns" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          <FooterColumn title="Explorer">
            <Link className={footerLinkClass} href="/#services">Nos services</Link>
            <Link className={footerLinkClass} href="/logements">Nos logements</Link>
            <Link className={footerLinkClass} href="/seminaires">Séminaires</Link>
            <Link className={footerLinkClass} href="/decouvrir">Découvrir</Link>
            <Link className={footerLinkClass} href="/concept">Notre approche</Link>
            <Link className={footerLinkClass} href="/blog">Le blog</Link>
          </FooterColumn>

          <FooterColumn title="Propriétaires">
            <Link className={footerLinkClass} href="/confier-mon-logement">Confier un logement</Link>
            <Link className={footerLinkClass} href="/auth/login">Se connecter</Link>
          </FooterColumn>

          <FooterColumn title="Nous contacter">
            <HelpContactDialog className={footerLinkClass} />
            <a className={footerLinkClass} href="mailto:bonjour@mystay.city">bonjour@mystay.city</a>
            <p className="inline-flex min-h-8 items-center">Haute-Savoie, France</p>
          </FooterColumn>
        </div>
      </div>

      <FooterDestinations className={`${marketingContainerClass} mt-14 border-t border-slate-700 pt-10`} />

      <div
        className={`${marketingContainerClass} mt-14 flex flex-col gap-3 border-t border-slate-700 pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between`}
      >
        <span>© 2026 MyStay. Tous droits réservés.</span>
        <div className="flex flex-wrap gap-x-5">
          <Link className={footerLinkClass} href="/mentions-legales">Mentions légales</Link>
          <Link className={footerLinkClass} href="/confidentialite">Confidentialité</Link>
          <Link className={footerLinkClass} href="/cgu">CGU</Link>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1 text-[13px] text-slate-400 sm:text-xs">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">{title}</h2>
      {children}
    </div>
  )
}
