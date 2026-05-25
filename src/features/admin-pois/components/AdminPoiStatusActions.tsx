"use client"

import { useState, useTransition } from 'react'
import { ImagePlus, Power, Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
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

type ActionKind = 'disable' | 'archive' | 'restore' | 'refresh-official-photos'

type Props = {
  poiId: string
  status: AdminPoiStatus
  merchantAttached: boolean
}

const actionConfig: Record<ActionKind, { label: string; icon: React.ElementType; colorStyle: string; iconColor: string }> = {
  disable: { 
    label: 'Désactiver', 
    icon: Power, 
    colorStyle: 'border-amber-200/60 bg-amber-50/30 text-amber-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800', 
    iconColor: 'text-amber-500' 
  },
  archive: { 
    label: 'Archiver', 
    icon: Archive, 
    colorStyle: 'border-red-200/60 bg-red-50/30 text-red-700 hover:bg-red-50 hover:border-red-200 hover:text-red-800', 
    iconColor: 'text-red-500' 
  },
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

export function AdminPoiStatusActions({ poiId, status, merchantAttached }: Props) {
  return (
    <div className="flex flex-wrap gap-3 animate-in fade-in zoom-in-95 duration-500">
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
          description="Le POI sera restauré en statut inactif. Il restera masqué du guide public jusqu'à réactivation explicite."
        />
      ) : (
        <>
          {status === 'active' && (
            <ActionDialog
              poiId={poiId}
              action="disable"
              title="Désactiver ce POI"
              description={`Le POI disparaîtra du guide public mais restera éditable. ${merchantAttached ? 'Un Merchant est lié à cette fiche.' : ''}`}
            />
          )}
          <ActionDialog
            poiId={poiId}
            action="archive"
            title="Archiver ce POI"
            description={`Le POI sera supprimé logiquement, masqué du guide public et retiré des listes par défaut. ${merchantAttached ? 'Un Merchant est lié à cette fiche.' : ''}`}
            destructive
          />
        </>
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
      if (!response.ok) {
        const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
        setError(json?.error?.message ?? 'Action impossible')
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
          className={`group flex items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-[13px] font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${config.colorStyle}`}
        >
          <Icon size={16} strokeWidth={2.5} className={`transition-transform duration-300 group-hover:scale-110 ${config.iconColor}`} />
          {config.label}
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