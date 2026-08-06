'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Link from 'next/link'
import type { GuideView } from '@/features/guide-app/types'

export type GuideMenuItem = {
  label: string
  /** Vue interne à l'app : bascule sans quitter le cadre (guest confiné). */
  view?: GuideView
  /** Lien guide-scopé autorisé (ex. contact). Jamais vers le site public. */
  href?: string
}

// Items repris du menu public existant. Ils restent inactifs dans la démo.
const DEFAULT_MENU_ITEMS: GuideMenuItem[] = [
  { label: 'Bienvenue' },
  { label: 'Vos favoris' },
  { label: 'Tous nos logements' },
  { label: 'Agenda' },
  { label: 'Blog' },
  { label: 'Nous contacter' },
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[100] flex flex-col bg-white/80 px-7 pb-12 pt-5 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center text-slate-900"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>

          <motion.nav
            aria-label="Menu du guide"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
            className="mt-16"
          >
            <ul className="space-y-5">
              {items.map((item, index) => (
                <motion.li
                  key={`${item.label}-${item.view ?? item.href ?? 'disabled'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.05, duration: 0.25, ease: 'easeOut' }}
                >
                  {item.view ? (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate?.(item.view as GuideView)
                        onClose()
                      }}
                      className="block w-full text-left text-[26px] font-bold uppercase tracking-[-0.01em] text-slate-800 transition-colors hover:text-pink-600"
                    >
                      {item.label}
                    </button>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block text-[26px] font-bold uppercase tracking-[-0.01em] text-slate-800 transition-colors hover:text-pink-600"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="block cursor-default select-none text-[26px] font-bold uppercase tracking-[-0.01em] text-slate-800"
                    >
                      {item.label}
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
