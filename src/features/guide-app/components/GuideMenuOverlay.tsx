'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Link from 'next/link'

export type GuideMenuItem = {
  label: string
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
  lodgingName,
  items = DEFAULT_MENU_ITEMS,
}: {
  open: boolean
  onClose: () => void
  lodgingName: string
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
          className="absolute inset-0 z-[100] flex flex-col bg-white px-7 pb-12 pt-5"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="-mr-1 grid h-11 w-11 place-items-center text-slate-900"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>

          <motion.nav
            aria-label="Menu du guide"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
            className="mt-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              Navigation
            </p>
            <p className="mt-6 text-sm text-slate-500">
              Séjour en cours :{' '}
              <span className="font-semibold text-slate-900">{lodgingName}</span>
            </p>

            <ul className="mt-7 space-y-5">
              {items.map((item, index) => (
                <motion.li
                  key={`${item.label}-${item.href ?? 'disabled'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.05, duration: 0.25, ease: 'easeOut' }}
                >
                  {item.href ? (
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
                      className={`block cursor-default select-none text-[26px] font-bold uppercase tracking-[-0.01em] ${
                        item.label === 'Nous contacter'
                          ? 'text-slate-500'
                          : 'text-slate-800'
                      }`}
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
