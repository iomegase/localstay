'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { contextualContactPath } from '@/features/city-guide/lib/public-paths'

type MenuItem = { href: string; label: string }

type Props = {
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
  citySlug?: string | null
}

const ANONYMOUS_ITEMS: MenuItem[] = [
  { href: '/', label: 'Home' },
  { href: '/contact', label: 'Contact' },
]

function extractCitySlug(pathname?: string | null): string | null {
  if (!pathname) return null

  const match = pathname.match(/^\/guide\/([^/]+)/)
  return match?.[1] ?? null
}

function anonymousItems(citySlug?: string | null): MenuItem[] {
  return citySlug
    ? [
      { href: '/', label: 'Home' },
      { href: `/guide/${citySlug}/logements`, label: 'Logements' },
      { href: `/guide/${citySlug}/agenda`, label: 'Agenda' },
      { href: `/guide/${citySlug}/meteo`, label: 'Météo' },
      { href: contextualContactPath(citySlug), label: 'Contact' },
    ]
    : ANONYMOUS_ITEMS
}

function lodgingItems(citySlug?: string | null): MenuItem[] {
  const home = { href: '/', label: 'Home' }
  const contact = { href: contextualContactPath(citySlug), label: 'Nous Contacter' }

  if (!citySlug) return [home, contact]

  return [
    home,
    { href: `/guide/${citySlug}/logements`, label: 'Logements' },
    { href: `/guide/${citySlug}/agenda`, label: 'Agenda' },
    contact,
  ]
}

export function PublicMenu({ mode, lodgingName, citySlug }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const resolvedCitySlug = citySlug ?? extractCitySlug(pathname)
  const items = mode === 'lodging'
    ? lodgingItems(resolvedCitySlug)
    : anonymousItems(resolvedCitySlug)

  return (
    <>
      {isOpen && typeof document !== 'undefined' && createPortal(
        // Calque plein écran rendu via portal sur <body> : sort de l'en-tête
        // (dont le `backdrop-filter` piège le z-index/contexte d'empilement de
        // ses descendants `fixed`). Fond blanc opaque — aucune page ne transparaît.
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] bg-white"
        >
          <div
            data-testid="public-menu-overlay"
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-y-0 left-1/2 z-[110] flex w-full max-w-[430px] -translate-x-1/2 flex-col justify-between border-x border-black/5 bg-white p-8 shadow-2xl"
          >
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center text-charcoal transition-colors hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="mt-20 space-y-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
              Navigation
            </p>
            {mode === 'lodging' && lodgingName && (
              <p className="text-sm text-gray-500">
                Séjour en cours :{' '}
                <Link
                  href={citySlug ? `/guide/${citySlug}` : '/'}
                  className="font-medium text-charcoal underline-offset-4 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  {lodgingName}
                </Link>
              </p>
            )}
            <nav className="space-y-6">
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-2xl uppercase tracking-wide text-gray-800 font-bold transition-colors duration-200 hover:text-gray-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-gray-100 pt-8">
            <p className="text-sm text-gray-400">MyStay</p>
          </div>
          </div>
        </div>,
        document.body,
      )}

      <button
        type="button"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className="relative z-[80] w-10 h-10 flex flex-col justify-center items-end gap-1.5"
      >
        <span
          className={`h-[1.5px] bg-charcoal transition-all duration-300 ${
            isOpen ? 'w-6 translate-y-[3px] rotate-45' : 'w-6'
          }`}
        />
        <span
          className={`h-[1.5px] bg-charcoal transition-all duration-300 ${
            isOpen ? 'w-6 -translate-y-[3px] -rotate-45' : 'w-4'
          }`}
        />
      </button>
    </>
  )
}
