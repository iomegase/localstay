'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { BookOpen, Heart, Home, Map, Menu, X } from 'lucide-react'
import type { DemoGuideView } from '@/features/guide-demo/types'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'

const bottomNavigation = [
  { view: 'home' as const, ariaLabel: 'Accueil', label: 'Accueil', icon: Home },
  {
    view: 'lodging' as const,
    ariaLabel: 'Guide logement',
    label: 'Guide',
    icon: BookOpen,
  },
  {
    view: 'favorites' as const,
    ariaLabel: 'Coups de cœur',
    label: 'Coups de cœur',
    icon: Heart,
  },
  { view: 'map' as const, ariaLabel: 'Carte', label: 'Carte', icon: Map },
]

const menuNavigation = [
  { view: 'home' as const, label: 'Accueil' },
  { view: 'lodging' as const, label: 'Guide du logement' },
  { view: 'favorites' as const, label: 'Coups de cœur' },
  { view: 'map' as const, label: 'Carte' },
  { view: 'lodgings' as const, label: 'Nos logements' },
  { view: 'blog' as const, label: 'Blog' },
  { view: 'contact' as const, label: 'Nous contacter' },
]

type DemoGuideChromeProps = {
  activeView: DemoGuideView
  children: ReactNode
  mainRef: RefObject<HTMLElement>
  immersive?: boolean
  menuOpen: boolean
  onCloseMenu: () => void
  onNavigate: (view: DemoGuideView) => void
  onOpenMenu: () => void
}

export function DemoGuideChrome({
  activeView,
  children,
  mainRef,
  immersive = false,
  menuOpen,
  onCloseMenu,
  onNavigate,
  onOpenMenu,
}: DemoGuideChromeProps) {
  const appContentRef = useRef<HTMLDivElement>(null)
  const menuDialogRef = useRef<HTMLDivElement>(null)
  const menuOpenerRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const menuWasOpenRef = useRef(false)

  useEffect(() => {
    const appContent = appContentRef.current
    if (!appContent) return

    appContent.inert = menuOpen
    return () => {
      appContent.inert = false
    }
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) {
      menuWasOpenRef.current = true
      menuCloseRef.current?.focus()
      return
    }

    if (menuWasOpenRef.current) {
      menuWasOpenRef.current = false
      menuOpenerRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return

    function containMenuKeyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseMenu()
        return
      }

      if (event.key !== 'Tab') return

      const dialog = menuDialogRef.current
      if (!dialog) return

      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled])'),
      )
      const firstControl = controls[0]
      const lastControl = controls.at(-1)
      if (!firstControl || !lastControl) return

      const activeElement = document.activeElement
      if (
        event.shiftKey &&
        (activeElement === firstControl || !dialog.contains(activeElement))
      ) {
        event.preventDefault()
        lastControl.focus()
      } else if (
        !event.shiftKey &&
        (activeElement === lastControl || !dialog.contains(activeElement))
      ) {
        event.preventDefault()
        firstControl.focus()
      }
    }

    window.addEventListener('keydown', containMenuKeyboard, true)
    return () => {
      window.removeEventListener('keydown', containMenuKeyboard, true)
    }
  }, [menuOpen, onCloseMenu])

  return (
    <div
      data-guide-mode="demo"
      data-testid="autonomous-demo-guide"
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white text-slate-900"
    >
      <div
        ref={appContentRef}
        data-testid="demo-guide-content"
        aria-hidden={menuOpen ? 'true' : undefined}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {immersive ? null : (
          <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-white/50 bg-white/85 px-4 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              aria-label="Accueil du guide"
              className="flex min-w-0 items-center gap-2 text-left"
            >
              <MyStayLogo
                form="horizontal"
                className="h-9 w-auto object-contain"
                priority
                sizes="160px"
              />
            </button>

            <button
              ref={menuOpenerRef}
              type="button"
              onClick={onOpenMenu}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              aria-controls="demo-guide-menu"
              className="translate-x-1 translate-y-1.5 p-2 text-slate-800"
            >
              <Menu className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </button>
          </header>
        )}

        {immersive ? (
          <button
            ref={menuOpenerRef}
            type="button"
            onClick={onOpenMenu}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="demo-guide-menu"
            className="absolute right-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm backdrop-blur"
          >
            <Menu className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}

        <main
          ref={mainRef}
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </main>

        {!immersive ? <nav
          aria-label="Navigation de démonstration"
          className="absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-full border border-slate-100 bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.18)]"
        >
          <div className="grid grid-cols-4 gap-1">
            {bottomNavigation.map(item => {
              const active =
                item.view === activeView ||
                (item.view === 'favorites' && activeView === 'poi')
              const Icon = item.icon

              return (
                <button
                  key={item.view}
                  type="button"
                  aria-label={item.ariaLabel}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNavigate(item.view)}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[8px] font-bold uppercase tracking-wide leading-tight transition-colors ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-[17px] w-[17px] ${
                      item.view === 'favorites' ? 'text-pink-600' : ''
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav> : null}
      </div>

      {menuOpen ? (
        <div
          ref={menuDialogRef}
          id="demo-guide-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-guide-menu-title"
          className="absolute inset-0 z-[100] flex flex-col overflow-y-auto overscroll-contain bg-white/90 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur-xl min-[380px]:px-7"
        >
          <h2 id="demo-guide-menu-title" className="sr-only">
            Menu de démonstration
          </h2>
          <button
            ref={menuCloseRef}
            type="button"
            onClick={onCloseMenu}
            aria-label="Fermer le menu"
            className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center text-slate-900"
          >
            <X className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>

          <nav aria-label="Menu de démonstration" className="mt-12 py-2 min-[380px]:mt-16">
            <ul className="space-y-2 min-[380px]:space-y-3">
              {menuNavigation.map(item => (
                <li key={item.view}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.view)}
                    className="block w-full py-1.5 text-left text-[clamp(1.15rem,7vw,1.625rem)] font-bold uppercase leading-[1.05] tracking-[-0.01em] text-slate-800 transition-colors hover:text-pink-600 min-[380px]:py-2"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  )
}
