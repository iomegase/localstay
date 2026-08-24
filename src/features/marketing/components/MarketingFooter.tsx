import Link from 'next/link'
import { MarketingBrand } from './MarketingHeader'
import { marketingContainerClass } from './marketing-styles'

export function MarketingFooter() {
  return (
    <footer className="bg-slate-800 pb-7 pt-16 text-white sm:pt-20 xl:mt-[clamp(56px,7vw,80px)] xl:pt-[54px]">
      <div className={`${marketingContainerClass} grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]`}>
        <div>
          <MarketingBrand light />
          <p className="mt-5 max-w-xs text-xs leading-6 text-slate-400">
            La conciergerie locale qui prend soin des logements et accueille chaque voyageur avec
            attention.
          </p>
          <div className="mt-4 flex gap-2 text-[10px] text-slate-300">
            <a
              href="https://www.instagram.com/"
              aria-label="Instagram"
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-600 hover:border-white"
            >
              ig
            </a>
            <a
              href="https://www.linkedin.com/"
              aria-label="LinkedIn"
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-600 hover:border-white"
            >
              in
            </a>
          </div>
        </div>

        <FooterColumn title="Découvrir">
          <Link href="/decouvrir">Découvrir</Link>
          <Link href="/">Nos services</Link>
          <Link href="/logements">Nos logements</Link>
          <Link href="/seminaires">Séminaires</Link>
          <Link href="/concept">Notre approche</Link>
          <Link href="/blog">Le blog</Link>
        </FooterColumn>

        <FooterColumn title="Propriétaires">
          <Link href="/confier-mon-logement">Confier un logement</Link>
          <Link href="/auth/login">Se connecter</Link>
          <Link href="/confier-mon-logement">Aide &amp; contact</Link>
        </FooterColumn>

        <FooterColumn title="Nous contacter">
          <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a>
          <p>Haute-Savoie, France</p>
        </FooterColumn>
      </div>

      <div
        className={`${marketingContainerClass} mt-14 flex flex-col gap-5 border-t border-slate-700 pt-6 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between`}
      >
        <span>© 2026 MyStay. Tous droits réservés.</span>
        <div className="flex flex-wrap gap-5">
          <span>Mentions légales</span>
          <span>Confidentialité</span>
          <span>CGU</span>
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
    <div className="flex flex-col items-start gap-3 text-xs text-slate-400 [&_a:hover]:text-white">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">{title}</h2>
      {children}
    </div>
  )
}
