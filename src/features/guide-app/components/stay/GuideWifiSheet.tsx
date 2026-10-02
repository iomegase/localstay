'use client'

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
          <div className="rounded-2xl bg-[#F6F6F4] px-4 py-3">
            <dt className="text-[12px] text-[#697386]">Mot de passe</dt>
            <dd className="mt-0.5 break-all font-mono text-[16px] font-semibold text-[#111111]">{password || '—'}</dd>
          </div>
        </dl>
        {password ? (
          <button
            type="button"
            onClick={copyPassword}
            className={`mt-4 flex h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white transition-colors ${
              copied ? 'bg-[#DB2777]' : 'bg-[#111111]'
            }`}
          >
            {copied ? 'Copié ✓' : 'Copier le mot de passe'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
