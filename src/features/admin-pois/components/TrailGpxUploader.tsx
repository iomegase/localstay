'use client'

import { useRef, useState } from 'react'
import { Map, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export function TrailGpxUploader({
  poiId,
  hasTrailDetail = true,
}: {
  poiId: string
  hasTrailDetail?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setMessage(null)
    const formData = new FormData()
    formData.append('gpx', file)
    try {
      const response = await fetch(`/api/admin/pois/${poiId}/upload-gpx`, {
        method: 'POST',
        body: formData,
      })
      const json = await response.json().catch(() => null) as {
        error?: { message?: string }
        data?: { points?: number; distance_km?: number; created?: boolean }
      } | null
      if (!response.ok) {
        setError(json?.error?.message ?? 'Upload GPX impossible')
        return
      }
      const pts = json?.data?.points ?? 0
      const dist = json?.data?.distance_km ?? null
      const created = json?.data?.created
      const verb = created ? 'Fiche randonnée créée' : 'Tracé mis à jour'
      setMessage(`${verb} : ${pts} points${dist != null ? ` · ${dist.toFixed(1)} km` : ''}`)
      if (created) {
        // Reload pour révéler le rendu rando immersif côté public.
        setTimeout(() => window.location.reload(), 800)
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="rounded-[20px] border border-emerald-200/60 bg-emerald-50/40 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
          <Map size={20} strokeWidth={2.5} />
        </div>
        <div className="flex-1 pt-1">
          <h2 className="text-[15px] font-bold text-emerald-900">
            {hasTrailDetail ? 'Mettre à jour le tracé GPX' : 'Convertir en randonnée avec un GPX'}
          </h2>
          <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-emerald-700/80">
            {hasTrailDetail
              ? 'Importer un fichier .gpx pour remplacer la géométrie actuelle (LineString) et recalculer le point de départ.'
              : 'Ce POI est dans la catégorie rando mais n\'a pas encore de fiche randonnée. Importer un .gpx créera la fiche, le tracé, la distance et le point de départ d\'un coup.'}
            {' '}Sources fiables : apidae-tourisme.com, visorando (export manuel), traces GPS perso.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? 'Upload…' : 'Importer GPX'}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".gpx,application/gpx+xml,application/xml,text/xml"
              className="hidden"
              onChange={handleFile}
            />
            {message && <p className="text-xs text-emerald-700">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
