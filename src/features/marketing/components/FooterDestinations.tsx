'use client'

import Link from 'next/link'
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { FooterLocalLandingLinks } from '@/features/local-seo/types/footer-links'

const EMPTY: FooterLocalLandingLinks = { vacationRental: [], concierge: [], seminar: [] }

const FooterDestinationsContext = createContext<FooterLocalLandingLinks>(EMPTY)

export function FooterDestinationsProvider({
  value,
  children,
}: {
  value: FooterLocalLandingLinks
  children: ReactNode
}) {
  return <FooterDestinationsContext.Provider value={value}>{children}</FooterDestinationsContext.Provider>
}

const COLUMNS = [
  { key: 'vacationRental', title: 'Locations de vacances', hub: '/logements' },
  { key: 'concierge', title: 'Conciergerie', hub: '/confier-mon-logement' },
  { key: 'seminar', title: 'Séminaires', hub: '/seminaires' },
] as const

/** Bloc « Nos destinations » du footer (spec 046 AC-04-06). */
export function FooterDestinations({ className = '' }: { className?: string }) {
  const links = useContext(FooterDestinationsContext)
  const columns = COLUMNS.filter(column => links[column.key].length > 0)
  if (columns.length === 0) return null

  return (
    <nav aria-label="Nos destinations" className={className}>
      <h2 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Nos destinations</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {columns.map(column => (
          <div key={column.key} className="flex flex-col items-start gap-3 text-xs text-slate-400 [&_a:hover]:text-white">
            <Link href={column.hub} className="mb-1 text-[11px] font-semibold text-slate-200">
              {column.title}
            </Link>
            {links[column.key].map(link => (
              <Link key={link.href} href={link.href}>
                {link.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
