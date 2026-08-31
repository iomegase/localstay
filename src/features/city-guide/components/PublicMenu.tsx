'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Info, LogOut, Settings, X } from 'lucide-react'
import { contextualContactPath, contextualFavoritesPath } from '@/features/city-guide/lib/public-paths'
import { publicLodgingsPath } from '@/features/lodging-showcase/lib/public-paths'

type MenuItem = { href: string; label: string }

type Props = {
  mode: 'anonymous' | 'lodging'
  lodgingName?: string | null
  ownerName?: string | null
  citySlug?: string | null
}

const ANONYMOUS_ITEMS: MenuItem[] = [
  { href: '/', label: 'Bienvenue' },
  { href: contextualFavoritesPath(null), label: 'Vos favoris' },
  { href: '/contact', label: 'Contact' },
]

const LODGING_GUIDE_ITEMS = [
  { href: '#bienvenue', label: 'Bienvenue', icon: Home },
  { href: '#infos-pratiques', label: 'Infos pratiques', icon: Info },
  { href: '#bon-a-savoir', label: 'Bon à savoir', icon: Settings },
  { href: '#depart', label: 'Départ', icon: LogOut },
] as const

function extractCitySlug(pathname?: string | null): string | null {
  if (!pathname) return null

  const match = pathname.match(/^\/guide\/([^/]+)/)
  return match?.[1] ?? null
}

function anonymousItems(citySlug?: string | null): MenuItem[] {
  return citySlug
    ? [
      { href: '/', label: 'Bienvenue' },
      { href: contextualFavoritesPath(citySlug), label: 'Vos favoris' },
      { href: publicLodgingsPath(), label: 'Tous nos logements' },
      { href: `/guide/${citySlug}/agenda`, label: 'Agenda' },
      { href: contextualContactPath(citySlug), label: 'Contact' },
    ]
    : ANONYMOUS_ITEMS
}

function lodgingItems(citySlug?: string | null): MenuItem[] {
  const welcome = { href: '/nos-recommandations', label: 'Bienvenue' }
  const blog = { href: '/blog', label: 'Blog' }
  const contact = { href: contextualContactPath(citySlug), label: 'Nous Contacter' }

  if (!citySlug) return [welcome, blog, contact]

  return [
    welcome,
    { href: contextualFavoritesPath(citySlug), label: 'Vos favoris' },
    { href: publicLodgingsPath(), label: 'Tous nos logements' },
    { href: `/guide/${citySlug}/agenda`, label: 'Agenda' },
    blog,
    contact,
  ]
}

export function PublicMenu({ mode, lodgingName, citySlug }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const resolvedCitySlug = citySlug ?? extractCitySlug(pathname)
  const isLodgingGuide = pathname === '/le-logement'
  const items = mode === 'lodging'
    ? lodgingItems(resolvedCitySlug)
    : anonymousItems(resolvedCitySlug)

  useEffect(() => {
    if (!isOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

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
          {isLodgingGuide ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 px-1 pb-8 pt-1">
                <p className="text-[24px] font-extrabold tracking-[0.16em] text-slate-900">MYSTAY</p>
              </div>
              <div className="pt-10">
                <p className="mb-7 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Guide du logement
                </p>
                <nav aria-label="Guide du logement">
                  {LODGING_GUIDE_ITEMS.map(item => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex min-h-[74px] items-center gap-5 border-b border-slate-200 px-2 text-[20px] font-medium text-slate-900 transition-colors hover:bg-slate-50"
                      >
                        <Icon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </a>
                    )
                  })}
                </nav>
              </div>
            </div>
          ) : (
          <>
          <div className="mt-20 space-y-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
              Navigation
            </p>
            {mode === 'lodging' && lodgingName && (
              <p className="text-sm text-gray-500">
                Séjour en cours :{' '}
                <Link
                  href="/nos-recommandations"
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
          </>
          )}
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
