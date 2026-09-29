'use client'

import { useState } from 'react'
import { Copy, Wifi } from 'lucide-react'
import { GUIDE_CARD, GuideCardHeading } from '@/features/guide-app/components/GuideCard'

/** Carte Wi-Fi : mot de passe dans un encart clair qui le copie au tap (spec 050 AC-01-04). */
export function GuideWifiCard({ name, password }: { name: string; password: string }) {
  const [copied, setCopied] = useState(false)

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section data-testid="guide-practical-wifi" data-guide-card="true" className={GUIDE_CARD}>
      <GuideCardHeading
        icon={Wifi}
        tone="wifi"
        as="h2"
        title="Wi-Fi"
        hint={
          <>
            Réseau <span className="font-semibold text-white">{name}</span>
          </>
        }
      />
      <button
        type="button"
        onClick={copyPassword}
        aria-label={`Copier le mot de passe Wi-Fi ${password}`}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-left text-slate-900 transition-transform active:scale-[0.99]"
      >
        <span className="min-w-0">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Mot de passe
          </span>
          <code className="break-all text-base font-bold">{password}</code>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-[9px] text-slate-600">
          <Copy className="h-4 w-4 text-slate-900" aria-hidden="true" />
          <span aria-live="polite">{copied ? 'Copié' : 'Tapoter pour copier'}</span>
        </span>
      </button>
    </section>
  )
}
