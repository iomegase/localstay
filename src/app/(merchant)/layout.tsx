import type { ReactNode } from 'react'
import Link from 'next/link'

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-charcoal/10 bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/merchant" className="font-semibold tracking-tight text-charcoal">
            StayLocal Merchant
          </Link>
          <nav className="flex gap-4 text-sm text-charcoal/60">
            <Link href="/merchant/dashboard" className="hover:text-charcoal">Accueil</Link>
            <Link href="/merchant/profile" className="hover:text-charcoal">Ma fiche</Link>
            <Link href="/merchant/stats" className="hover:text-charcoal">Statistiques</Link>
            <Link href="/merchant/offers" className="hover:text-charcoal">Offres</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
