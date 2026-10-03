'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { GuideNavigation } from '@/features/guide-app/components/GuideNavigation'
import type { DemoGuideView } from '@/features/guide-demo/types'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'

const menuNavigation = [
  { view: 'lodgings' as const, label: 'Les logements' },
  { view: 'blog' as const, label: 'Journal' },
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
  const reducedMotion = useReducedMotion()
  const appContentRef = useRef<HTMLDivElement>(null)
  const menuDialogRef = useRef<HTMLDivElement>(null)
  const menuOpenerRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const restoreMenuOpenerOnCloseRef = useRef(false)
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
      restoreMenuOpenerOnCloseRef.current = false
      menuCloseRef.current?.focus()
      return
    }

    if (menuWasOpenRef.current) {
      menuWasOpenRef.current = false
      if (restoreMenuOpenerOnCloseRef.current) {
        menuOpenerRef.current?.focus()
      }
      restoreMenuOpenerOnCloseRef.current = false
    }
  }, [menuOpen])

  const dismissMenu = useCallback(() => {
    restoreMenuOpenerOnCloseRef.current = true
    onCloseMenu()
  }, [onCloseMenu])

  function navigateFromMenu(view: DemoGuideView) {
    restoreMenuOpenerOnCloseRef.current = false
    onNavigate(view)
  }

  useEffect(() => {
    if (!menuOpen) return

    function containMenuKeyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        dismissMenu()
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
  }, [dismissMenu, menuOpen])

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

        {/* Spec 054 AC-06-01 : même barre d'onglets que le guide privé. */}
        {!immersive ? <GuideNavigation activeView={activeView} onNavigate={onNavigate} /> : null}
      </div>

      <AnimatePresence>
      {menuOpen ? (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.32 } }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 16, transition: { duration: reducedMotion ? 0 : 0.24 } }}
          ref={menuDialogRef}
          id="demo-guide-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-guide-menu-title"
          className="absolute inset-0 z-[100] flex flex-col overflow-y-auto overscroll-contain bg-white/[0.98] px-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] backdrop-blur-xl min-[380px]:px-7"
        >
          <h2 id="demo-guide-menu-title" className="sr-only">
            Menu de démonstration
          </h2>
          <motion.button
            initial={{ rotate: reducedMotion ? 0 : -90 }}
            animate={{ rotate: 0, transition: { duration: reducedMotion ? 0 : 0.32 } }}
            exit={{ rotate: reducedMotion ? 0 : 90, transition: { duration: reducedMotion ? 0 : 0.24 } }}
            ref={menuCloseRef}
            type="button"
            onClick={dismissMenu}
            aria-label="Fermer le menu"
            className="ml-auto grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-500"
          >
            <X className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </motion.button>

          <nav aria-label="Menu de démonstration" className="mt-5 flex min-h-[280px] flex-1 flex-col">
            <ul className="grid flex-1 auto-rows-fr divide-y divide-slate-200">
              {menuNavigation.map((item, index) => (
                <motion.li key={item.view}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reducedMotion ? 0 : index * 0.04, duration: reducedMotion ? 0 : 0.28 }}
                  className="flex"
                >
                  <button
                    type="button"
                    onClick={() => navigateFromMenu(item.view)}
                    className="flex min-h-24 w-full flex-col justify-center py-8 text-left text-[36px] font-medium leading-[1.08] tracking-[-0.04em] text-slate-900 transition-colors hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500 min-[375px]:text-[44px]"
                  >
                    {item.label === 'Les logements' ? <>Les <br />logements</> : item.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  )
}
