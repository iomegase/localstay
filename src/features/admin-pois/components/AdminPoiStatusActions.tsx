"use client"

import { useState, useTransition } from 'react'
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

const actionLabels: Record<ActionKind, string> = {
  disable: 'Désactiver',
  archive: 'Archiver',
  restore: 'Restaurer',
  'refresh-official-photos': 'Enrichir photos',
}

export function AdminPoiStatusActions({ poiId, status, merchantAttached }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionDialog
        poiId={poiId}
        action="refresh-official-photos"
        title="Rafraîchir les photos officielles"
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
        <Button type="button" variant={destructive ? 'destructive' : 'outline'} size="sm">
          {actionLabels[action]}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white text-slate-950">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Confirmation requise : cette action a un impact public immédiat.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={submit} disabled={isPending}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
