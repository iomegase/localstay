'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LocateFixed } from 'lucide-react'

type GpsStatus = 'inactive' | 'active' | 'denied'

const CYCLE = ['#22c55e', '#f97316', '#ef4444', '#f97316', '#22c55e']

export function GuideGpsCard() {
  const [status, setStatus] = useState<GpsStatus>('inactive')
  const active = status === 'active'

  function activate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setStatus('active'),
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <button
      type="button"
      onClick={activate}
      aria-label="Activer mon GPS"
      className="flex w-full items-center justify-between gap-3 rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600">
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Activer mon GPS</span>
          <span className="mt-0.5 block text-[10px] text-white/60">
            {active
              ? 'GPS activé — localisation en cours.'
              : 'Activez votre GPS pour profiter pleinement de l’application.'}
          </span>
        </span>
      </span>

      <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {!active && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            animate={{
              backgroundColor: CYCLE,
              opacity: [0.5, 0.12, 0.5],
              scale: [1, 2.1, 1],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.span
          aria-hidden="true"
          className="relative h-3.5 w-3.5 rounded-full"
          animate={
            active
              ? { backgroundColor: '#22c55e', scale: 1 }
              : { backgroundColor: CYCLE, scale: [1, 1.15, 1] }
          }
          transition={
            active
              ? { duration: 0.3 }
              : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </span>
    </button>
  )
}
