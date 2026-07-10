'use client'

import { useState } from 'react'
import { Check, Copy, ShieldCheck } from 'lucide-react'

type Props = {
  ssid: string | null
  password: string | null
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // presse-papier indisponible : on ignore silencieusement
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F3F5] text-slate-800 transition-colors hover:bg-slate-200"
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

function CredentialRow({ label, value, copyLabel }: { label: string; value: string; copyLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-0.5 break-all font-mono text-base font-bold text-slate-800">{value}</p>
      </div>
      <CopyButton value={value} label={copyLabel} />
    </div>
  )
}

export function WifiCredentials({ ssid, password }: Props) {
  const hasSsid = Boolean(ssid && ssid !== '—')
  const hasPassword = Boolean(password && password !== '—')
  if (!hasSsid && !hasPassword) return null

  return (
    <div>
      <div className="divide-y divide-slate-100">
        {hasSsid && (
          <CredentialRow label="Nom du réseau" value={ssid as string} copyLabel="Copier le nom du réseau" />
        )}
        {hasPassword && (
          <CredentialRow label="Mot de passe" value={password as string} copyLabel="Copier le mot de passe" />
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Connexion sécurisée</span>
      </div>
    </div>
  )
}
