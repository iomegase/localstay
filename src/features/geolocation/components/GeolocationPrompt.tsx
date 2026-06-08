'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { LocateFixed, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { readDismissed, readStoredLocation } from '../lib/user-location'
import { useUserLocation } from '../hooks/useUserLocation'

/**
 * Modale centrée invitant l'utilisateur à activer la géolocalisation pour
 * personnaliser les distances. Apparaît une fois à l'arrivée sur la page guide,
 * sauf si une position est déjà connue ou si l'utilisateur a déjà refusé.
 */
export function GeolocationPrompt() {
  const { status, requestLocation, dismiss } = useUserLocation()
  const [open, setOpen] = useState(false)

  // Ouverture différée : seulement si aucune décision préalable + API dispo.
  useEffect(() => {
    const canPrompt =
      typeof navigator !== 'undefined' &&
      !!navigator.geolocation &&
      !readStoredLocation() &&
      !readDismissed()
    if (!canPrompt) return
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [])

  // Refermer dès que la position est obtenue.
  useEffect(() => {
    if (status === 'ready') setOpen(false)
  }, [status])

  function handleEnable() {
    requestLocation()
  }

  function handleDismiss() {
    dismiss()
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="geolocation-prompt"
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={handleDismiss}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
          />

          {/* Carte */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="geo-prompt-title"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-ivory shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fermer"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-charcoal/40 transition-colors hover:text-charcoal/70"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center">
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/12 text-gold"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <LocateFixed className="h-7 w-7" />
              </motion.div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                Autour de vous
              </p>
              <h2
                id="geo-prompt-title"
                className="mt-2 font-serif text-2xl font-light leading-snug text-charcoal"
              >
                Activez votre position
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                Pour afficher les distances depuis l&apos;endroit où vous vous trouvez et
                trier les lieux au plus près de vous.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={status === 'loading'}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-3.5 text-sm font-semibold text-ivory transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  <LocateFixed className="h-4 w-4" />
                  {status === 'loading' ? 'Localisation…' : 'Activer la géolocalisation'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-charcoal/45 transition-colors hover:text-charcoal/70"
                >
                  Plus tard
                </button>
              </div>

              {status === 'denied' && (
                <p className="mt-4 text-xs leading-relaxed text-charcoal/45">
                  Accès refusé. Les distances resteront calculées depuis le centre-ville.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
