'use client'

import { Check, Copy, Map } from 'lucide-react'
import type { GuideLodging } from '@/features/guide-app/types'
import { copyToClipboard, useTemporaryFlag } from './useTemporaryFlag'

/** Adresse et bouton Maps des captures PO (spec 054 AC-01-05 / AC-04-01). */
export function GuideAddressBlock({ lodging }: { lodging: GuideLodging }) {
  const [copied, flagCopied] = useTemporaryFlag(1600)
  const [street, ...localityParts] = lodging.addressLabel.split(',')
  const locality = localityParts.join(',').trim()

  async function copyAddress() {
    if (await copyToClipboard(lodging.addressLabel)) flagCopied()
  }

  return (
    <div className="mt-4">
      <div data-testid="arrival-address" className="flex items-center justify-between gap-3 rounded-2xl shadow-md bg-white p-4 text-slate-600">
        <address className="min-w-0 break-words text-[12px] tracking-wide leading-snug not-italic">
          <span className="block">{street.trim()}</span>
          {locality && <span className="block">{locality}</span>}
        </address>
        <button
          type="button"
          onClick={copyAddress}
          aria-label={copied ? 'Adresse copiée' : "Copier l'adresse"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#DB2777] transition-colors hover:bg-[#FCE7F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
        >
          {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

export function GuideMapsButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-4 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-[0_7px_16px_rgba(17,24,39,0.07)] transition-[transform,box-shadow] hover:shadow-[0_9px_20px_rgba(17,24,39,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:scale-[0.98]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
        <Map className="h-4 w-4" aria-hidden="true" />
      </span>
      Ouvrir dans Maps
    </a>
  )
}
