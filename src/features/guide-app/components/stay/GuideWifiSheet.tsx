'use client'

import { Check, Copy } from 'lucide-react'
import { copyToClipboard, useTemporaryFlag } from './useTemporaryFlag'

/** Feuille basse Wi-Fi (spec 054 AC-01-04). */
export function GuideWifiSheet({
  open,
  name,
  password,
  onClose,
}: {
  open: boolean
  name: string
  password: string
  onClose: () => void
}) {
  const [copied, flagCopied] = useTemporaryFlag(1800)
  if (!open) return null

  async function copyPassword() {
    if (await copyToClipboard(password)) flagCopied()
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div
        data-testid="guide-wifi-sheet-backdrop"
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-guide-fade-in bg-[rgba(17,17,17,0.4)] motion-reduce:animate-none"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-wifi-sheet-title"
        className="relative animate-guide-sheet-up rounded-t-[28px] bg-white px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 motion-reduce:animate-none"
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-[rgba(17,17,17,0.15)]" aria-hidden="true" />
        <h2 id="guide-wifi-sheet-title" className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">
          Wi-Fi
        </h2>
        <dl className="mt-4 grid gap-2.5">
          <div className="rounded-2xl bg-[#F6F6F4] px-4 py-3">
            <dt className="text-[12px] text-[#697386]">Réseau</dt>
            <dd className="mt-0.5 text-[16px] font-semibold text-[#111111]">{name || '—'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F6F6F4] px-4 py-3">
            <div className="min-w-0">
              <dt className="text-[12px] text-[#697386]">Mot de passe</dt>
              <dd className="mt-0.5 break-all font-mono text-[16px] font-semibold text-[#111111]">{password || '—'}</dd>
            </div>
            {password && (
              <button
                type="button"
                onClick={copyPassword}
                aria-label={copied ? 'Mot de passe copié' : 'Copier le mot de passe'}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#DB2777] transition-colors hover:bg-[#FCE7F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
              >
                {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
              </button>
            )}
          </div>
        </dl>
      </div>
    </div>
  )
}
