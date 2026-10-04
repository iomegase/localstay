'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import Link from 'next/link'
import type { GuideView } from '@/features/guide-app/types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

export type GuideMenuItem = {
  label: string
  /** Vue interne à l'app : bascule sans quitter le cadre (guest confiné). */
  view?: GuideView
  /** Lien guide-scopé autorisé (ex. contact). Jamais vers le site public. */
  href?: string
}

// Items repris du menu public existant. Ils restent inactifs dans la démo.
const DEFAULT_MENU_ITEMS: GuideMenuItem[] = [
  { label: 'Les logements', view: 'lodgings' },
  { label: 'Journal', view: 'blog' },
]

export function GuideMenuOverlay({
  open,
  onClose,
  onNavigate,
  items = DEFAULT_MENU_ITEMS,
}: {
  open: boolean
  onClose: () => void
  /** Bascule vers une vue interne de l'app (items `view`). */
  onNavigate?: (view: GuideView) => void
  /** Toujours accepté (passé par GuideApp) même si plus affiché. */
  lodgingName?: string
  items?: GuideMenuItem[]
}) {
  const reducedMotion = useReducedMotion()
  const m = useGuideMessages()
  // Spec 061 : libellés des vues internes traduits ; « Les logements » sur deux lignes.
  const labelOf = (item: GuideMenuItem) =>
    item.view === 'lodgings' ? <>{m.menu.lodgingsFirstLine} <br />{m.menu.lodgingsSecondLine}</>
      : item.view === 'blog' ? m.menu.blog
        : item.label

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="guide-menu-overlay"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.32 } }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 16, transition: { duration: reducedMotion ? 0 : 0.24 } }}
          className="absolute inset-0 z-[100] flex flex-col overflow-y-auto bg-white/[0.98] pb-[max(1.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
        >
          {/* Spec 054 AC-01-14 : même rangée que l'en-tête, la croix remplace l'icône menu au même endroit. */}
          <div className="flex h-[68px] shrink-0 items-center justify-end pr-[10px]">
          <motion.button
            initial={{ rotate: reducedMotion ? 0 : -90 }}
            animate={{ rotate: 0, transition: { duration: reducedMotion ? 0 : 0.32 } }}
            exit={{ rotate: reducedMotion ? 0 : 90, transition: { duration: reducedMotion ? 0 : 0.24 } }}
            type="button"
            onClick={onClose}
            aria-label={m.menu.close}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-500"
          >
            <X className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </motion.button>
          </div>

          <motion.nav
            aria-label={m.menu.label}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.32, ease: 'easeOut' }}
            className="mt-5 flex min-h-[280px] flex-1 flex-col px-7"
          >
            <ul className="grid flex-1 auto-rows-fr divide-y divide-slate-200">
              {items.map((item, index) => (
                <motion.li
                  key={item.view ?? item.href ?? item.label}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reducedMotion ? 0 : index * 0.04, duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
                  className="flex"
                >
                  {item.view ? (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate?.(item.view as GuideView)
                        onClose()
                      }}
                      className="flex min-h-24 w-full flex-col justify-center py-8 text-left text-[36px] font-medium leading-[1.08] tracking-[-0.04em] text-slate-900 transition-colors hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500 min-[375px]:text-[44px]"
                    >
                      {labelOf(item)}
                    </button>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex min-h-24 w-full flex-col justify-center py-8 text-left text-[36px] font-medium leading-[1.08] tracking-[-0.04em] text-slate-900 transition-colors hover:text-slate-600 min-[375px]:text-[44px]"
                    >
                      {labelOf(item)}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex w-full flex-col justify-center py-8 text-[36px] font-medium leading-[1.08] tracking-[-0.04em] text-slate-900 min-[375px]:text-[44px]"
                    >
                      {labelOf(item)}
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
