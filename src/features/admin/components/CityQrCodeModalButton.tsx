'use client'
import { useState } from 'react'
import { Download, QrCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'

interface CityQr {
  url: string
  storage_url: string
  created_at: string
}

interface Props {
  citySlug: string
  cityName: string
}

/**
 * Déclencheur + modal de génération du QR ville (super-admin). Remplace la navigation vers
 * une page dédiée : le QR se génère et s'affiche dans une fenêtre, sans quitter la liste.
 * Le PNG est servi brut (<img>), pas via l'optimiseur next/image (qui rejette l'hôte Supabase).
 */
export function CityQrCodeModalButton({ citySlug, cityName }: Props) {
  const endpoint = `/api/admin/cities/${citySlug}/qr-code`
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<CityQr | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Passe à true après une génération/régénération réussie dans cette session : l'action
  // devient alors « Fermer » (au lieu de « Générer »/« Régénérer »).
  const [justGenerated, setJustGenerated] = useState(false)

  async function loadQr() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(endpoint)
      if (res.status === 404) {
        setQr(null)
        return
      }
      if (!res.ok) throw new Error()
      const json = await res.json()
      setQr(json.data)
    } catch {
      setError('Impossible de charger le QR code.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    setJustGenerated(false)
    void loadQr()
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setQr(json.data)
      setJustGenerated(true)
    } catch {
      setError('La génération a échoué. Veuillez réessayer.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-[13px] font-bold text-gray-600 transition-all duration-300 hover:border-gray-200 hover:text-[#0B1437]"
      >
        <QrCode size={16} />
        QR code
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR code — {cityName}</DialogTitle>
          </DialogHeader>

          {loading && <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p>}

          {!loading && qr && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                // Param anti-cache : le PNG est ré-écrit au même chemin Supabase à chaque
                // régénération ; sans ce ?v=, le navigateur réafficherait l'ancien en cache.
                src={`${qr.storage_url}?v=${encodeURIComponent(qr.created_at)}`}
                alt="QR Code"
                width={220}
                height={220}
                className="rounded-md border border-border"
              />
              <p className="break-all text-center text-xs text-muted-foreground">{qr.url}</p>
              <p className="text-xs text-muted-foreground">
                Généré le {new Date(qr.created_at).toLocaleDateString('fr-FR')}
              </p>
              <a
                href={qr.storage_url}
                download={`qr-${citySlug}.png`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0B1437] underline underline-offset-2"
              >
                <Download className="h-4 w-4" />
                Télécharger PNG
              </a>
            </div>
          )}

          {!loading && !qr && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun QR code généré pour cette ville.
            </p>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            {justGenerated ? (
              <Button onClick={() => setOpen(false)}>Fermer</Button>
            ) : (
              <Button onClick={handleGenerate} disabled={generating || loading}>
                {generating ? 'Génération…' : qr ? 'Régénérer' : 'Générer le QR code'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
