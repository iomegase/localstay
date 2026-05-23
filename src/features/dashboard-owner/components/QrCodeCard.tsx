'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Download, RefreshCw } from 'lucide-react'

interface Props {
  lodgingId: string
  qrCode: {
    id: string
    url: string
    storage_url: string
    created_at: string
  } | null
  scanCount7d: number
}

export function QrCodeCard({ lodgingId, qrCode, scanCount7d }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/lodgings/${lodgingId}/qr-code`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error?.message ?? 'Une erreur est survenue')
        return
      }
      setDialogOpen(false)
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (!qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif italic text-lg">QR Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-muted-foreground text-center">
            Aucun QR code généré pour ce logement.
          </p>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Génération…' : 'Générer le QR code'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif italic text-lg">QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Image
              src={qrCode.storage_url}
              alt="QR Code"
              width={200}
              height={200}
              className="rounded-md border border-border"
            />
          </div>
          <p className="text-xs text-muted-foreground break-all text-center">{qrCode.url}</p>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Généré le {new Date(qrCode.created_at).toLocaleDateString('fr-FR')}</span>
            <span>{scanCount7d} scan{scanCount7d !== 1 ? 's' : ''} (7j)</span>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a href={qrCode.storage_url} download={`qr-code-${lodgingId}.png`} target="_blank" rel="noreferrer">
                <Download className="w-4 h-4" />
                Télécharger PNG
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <RefreshCw className="w-4 h-4" />
              Régénérer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif italic">Régénérer le QR code ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            L&apos;ancien QR code sera archivé et ne fonctionnera plus. Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Génération…' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
