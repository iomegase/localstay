'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { LodgingDialog } from './LodgingDialog'
import type { LodgingItem } from '../queries/lodgings'
import { Plus, Pencil, QrCode, SlidersHorizontal } from 'lucide-react'

interface City {
  id: string
  name: string
}

interface Props {
  lodgings: LodgingItem[]
  cities: City[]
}

export function LodgingsTable({ lodgings, cities }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LodgingItem | undefined>()

  function openCreate() {
    setEditTarget(undefined)
    setDialogOpen(true)
  }

  function openEdit(lodging: LodgingItem) {
    setEditTarget(lodging)
    setDialogOpen(true)
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/dashboard/lodgings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Ajouter un logement
        </Button>
      </div>

      {lodgings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Aucun logement. Ajoutez-en un pour commencer.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>QR code</TableHead>
              <TableHead className="text-right">Scans</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lodgings.map(lodging => (
              <TableRow key={lodging.id}>
                <TableCell className="font-medium">{lodging.name}</TableCell>
                <TableCell className="text-muted-foreground">{lodging.city_name}</TableCell>
                <TableCell>
                  <Badge
                    variant={lodging.qr_code_status === 'generated' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    <QrCode className="w-3 h-3" />
                    {lodging.qr_code_status === 'generated' ? 'Généré' : 'Manquant'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{lodging.qr_scan_count}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/lodgings/${lodging.id}/customize`)}
                    className="gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Personnaliser
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(lodging)}
                    className="gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeactivate(lodging.id)}
                    disabled={!lodging.is_active}
                    className="gap-1 text-muted-foreground"
                  >
                    Désactiver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <LodgingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lodging={editTarget}
        cities={cities}
      />
    </>
  )
}
