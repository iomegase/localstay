"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Trash2, ArchiveRestore } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import type { AdminPoiStatus } from '../types'

type ActionKind = 'restore' | 'refresh-official-photos'

type Props = {
  poiId: string
  status: AdminPoiStatus
  merchantAttached: boolean
}

const actionConfig: Record<ActionKind, { label: string; icon: React.ElementType; colorStyle: string; iconColor: string }> = {
  restore: { 
    label: 'Restaurer', 
    icon: ArchiveRestore, 
    colorStyle: 'border-emerald-200/60 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800', 
    iconColor: 'text-emerald-500' 
  },
  'refresh-official-photos': { 
    label: 'Enrichir photos', 
    icon: ImagePlus, 
    colorStyle: 'border-indigo-200/60 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800', 
    iconColor: 'text-indigo-500' 
  },
}

// Spec 068 AC-07-01 : actions en icônes seules (nom accessible + info-bulle).
const iconButtonClass = 'h-8 w-8 shrink-0 rounded-lg border p-0 shadow-none transition-colors'

export function AdminPoiStatusActions({ poiId, status, merchantAttached }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'archived' && (
        <ActiveSwitch poiId={poiId} active={status === 'active'} merchantAttached={merchantAttached} />
      )}
      <ActionDialog
        poiId={poiId}
        action="refresh-official-photos"
        title="Rafraîchir les photos"
        description="Le scraper officiel relira le site web du POI et ajoutera uniquement les nouvelles URLs exploitables, sans supprimer les photos existantes."
      />
      {status === 'archived' ? (
        <ActionDialog
          poiId={poiId}
          action="restore"
          title="Restaurer ce POI"
          description="Le POI effacé sera restauré en statut inactif. Il restera masqué du guide public jusqu'à réactivation explicite."
        />
      ) : (
        <QuickDeleteButton poiId={poiId} merchantAttached={merchantAttached} />
      )}
    </div>
  )
}

function ActionDialog({
  poiId,
  action,
  title,
  description,
  destructive = false,
}: {
  poiId: string
  action: ActionKind
  title: string
  description: string
  destructive?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const config = actionConfig[action]
  const Icon = config.icon

  function submit() {
    setError(null)
    startTransition(async () => {
      const response = await fetch(`/api/admin/pois/${poiId}/${action}`, { method: 'POST' })
      const json = await response.json().catch(() => null) as {
        error?: { message?: string }
        data?: { photos_added?: number; diagnostic?: string }
      } | null
      if (!response.ok) {
        setError(json?.error?.message ?? 'Action impossible')
        return
      }
      if (action === 'refresh-official-photos' && json?.data?.photos_added === 0) {
        setError(json?.data?.diagnostic ?? 'Aucune photo ajoutée (aucune nouvelle source détectée)')
        return
      }
      window.location.reload()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={config.label}
          title={config.label}
          className={`${iconButtonClass} ${config.colorStyle}`}
        >
          <Icon aria-hidden="true" size={15} strokeWidth={2.25} className={config.iconColor} />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-[440px]">
        <div className="relative overflow-hidden rounded-[32px] bg-white p-8 text-slate-950 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)]">
          {/* Lueur décorative subtile */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-slate-100 opacity-50 blur-3xl" />
          
          <DialogHeader className="relative mb-6 space-y-4 text-left">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 transition-transform ${config.iconColor}`}>
              <Icon size={24} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">{title}</DialogTitle>
              <DialogDescription className="mt-2 text-[15px] leading-relaxed text-slate-500">{description}</DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="relative mb-8 rounded-2xl border border-amber-100/50 bg-amber-50/30 p-5">
            <p className="flex items-start gap-3 text-[14px] font-medium leading-relaxed text-amber-800">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/50 text-[11px] font-black text-amber-700">!</span>
              Confirmation requise : cette action a un impact public immédiat.
            </p>
          </div>
          
          {error && (
            <div className="relative mb-6 rounded-2xl border border-red-100/50 bg-red-50/30 p-4">
              <p className="text-[14px] font-bold text-red-600">{error}</p>
            </div>
          )}
          
          <DialogFooter className="relative flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-[14px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:text-slate-900 focus:ring-0 sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              variant={destructive ? 'destructive' : 'default'} 
              onClick={submit} 
              disabled={isPending}
              className={`h-12 rounded-xl px-6 text-[14px] font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:ring-0 sm:w-auto ${
                destructive 
                  ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/20' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20'
              }`}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  En cours
                </span>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QuickDeleteButton({ poiId, merchantAttached }: { poiId: string; merchantAttached: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    const merchantNote = merchantAttached ? ' Un Merchant est lié à cette fiche.' : ''
    if (!confirm(`Effacer ce POI ? Il sera masqué du guide public (restaurable via "Effacés").${merchantNote}`)) return

    setError(null)
    startTransition(async () => {
      const response = await fetch(`/api/admin/pois/${poiId}/delete`, { method: 'POST' })
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        setError(json?.error?.message ?? 'Action impossible')
        return
      }
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={handleClick}
        aria-label="Effacer"
        title="Effacer"
        className={`${iconButtonClass} border-red-200/60 bg-red-50/30 hover:border-red-200 hover:bg-red-50 disabled:opacity-60`}
      >
        <Trash2 aria-hidden="true" size={15} strokeWidth={2.25} className="text-red-500" />
      </Button>
      {error && <p role="alert" className="px-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Spec 068 AC-07-02 : « POI actif » remplace « Désactiver ». Décocher passe par la route
 * `disable` (après confirmation), cocher réactive via `PATCH is_active: true`.
 */
function ActiveSwitch({
  poiId,
  active,
  merchantAttached,
}: {
  poiId: string
  active: boolean
  merchantAttached: boolean
}) {
  const router = useRouter()
  const [checked, setChecked] = useState(active)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(nextActive: boolean) {
    if (!nextActive) {
      const merchantNote = merchantAttached ? ' Un Merchant est lié à cette fiche.' : ''
      if (!confirm(`Désactiver ce POI ? Il disparaîtra du guide public mais restera éditable.${merchantNote}`)) return
    }

    setError(null)
    setChecked(nextActive)
    startTransition(async () => {
      const response = nextActive
        ? await fetch(`/api/admin/pois/${poiId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true }),
        })
        : await fetch(`/api/admin/pois/${poiId}/disable`, { method: 'POST' })
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        setChecked(!nextActive)
        setError(json?.error?.message ?? 'Action impossible')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <label className="inline-flex items-center gap-1.5" title={checked ? 'POI actif' : 'POI inactif'}>
        <Switch
          checked={checked}
          disabled={isPending}
          onCheckedChange={toggle}
          aria-label="POI actif"
          className="data-[state=checked]:bg-emerald-500"
        />
      </label>
      {error && <p role="alert" className="text-[10px] font-semibold text-rose-600">{error}</p>}
    </div>
  )
}
