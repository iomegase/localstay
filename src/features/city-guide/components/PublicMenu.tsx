'use client'

import { useState } from 'react'
import Link from 'next/link'

type MenuItem = { href: string; label: string }

type Props = {
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
  citySlug?: string | null
}

const ANONYMOUS_ITEMS: MenuItem[] = [
  { href: '/', label: 'Bienvenue' },
  { href: '/contact', label: 'Contact' },
]

function anonymousItems(citySlug?: string | null): MenuItem[] {
  return citySlug
    ? [
      { href: '/', label: 'Bienvenue' },
      { href: `/guide/${citySlug}/meteo`, label: 'Météo' },
      { href: '/contact', label: 'Contact' },
    ]
    : ANONYMOUS_ITEMS
}

function lodgingItems(ownerName?: string | null, citySlug?: string | null): MenuItem[] {
  const recommendationLabel = ownerName
    ? `Les recommandations de ${ownerName}`
    : 'Les recommandations de votre hôte'

  const items = [
    { href: '/', label: 'Bienvenue' },
    { href: '/le-logement', label: 'Le Logement' },
    { href: '/nos-recommandations', label: recommendationLabel },
    { href: '/mes-favoris', label: 'Vos favoris' },
    { href: '/contact', label: 'Nous Contacter' },
  ]

  return citySlug
    ? [
      ...items.slice(0, 4),
      { href: `/guide/${citySlug}/meteo`, label: 'Météo' },
      ...items.slice(4),
    ]
    : items
}

export function PublicMenu({ mode, lodgingName, ownerName, citySlug }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const items = mode === 'lodging' ? lodgingItems(ownerName, citySlug) : anonymousItems(citySlug)

  return (
    <>
      {isOpen && (
        <div
          data-testid="public-menu-overlay"
          className="fixed inset-y-0 left-1/2 z-[60] flex w-full max-w-[430px] -translate-x-1/2 flex-col justify-between bg-white p-8"
        >
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
