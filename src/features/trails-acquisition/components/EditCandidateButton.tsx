'use client'

import { useRef, useState } from 'react'
import { Pencil, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

const DIFFICULTIES = [
  { value: '', label: '— Non défini —' },
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
  { value: 'expert', label: 'Expert' },
  { value: 'unknown', label: 'Inconnu' },
] as const

type Props = {
  candidateId: string
  initial: {
    title: string
    description: string | null
    difficulty: string | null
    start_label: string | null
    distance_km: number | null
    elevation_gain_m: number | null
    estimated_duration_min: number | null
  }
  disabled?: boolean
}

export function EditCandidateButton({ candidateId, initial, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gpxInputRef = useRef<HTMLInputElement>(null)
  const [gpxUploading, setGpxUploading] = useState(false)
  const [gpxMessage, setGpxMessage] = useState<string | null>(null)
  const [gpxError, setGpxError] = useState<string | null>(null)

  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description ?? '')
  const [difficulty, setDifficulty] = useState(initial.difficulty ?? '')
  const [startLabel, setStartLabel] = useState(initial.start_label ?? '')
  const [distance, setDistance] = useState(initial.distance_km != null ? String(initial.distance_km) : '')
  const [elevation, setElevation] = useState(initial.elevation_gain_m != null ? String(initial.elevation_gain_m) : '')
  const [duration, setDuration] = useState(initial.estimated_duration_min != null ? String(initial.estimated_duration_min) : '')

  function reset() {
    setTitle(initial.title)
    setDescription(initial.description ?? '')
    setDifficulty(initial.difficulty ?? '')
    setStartLabel(initial.start_label ?? '')
    setDistance(initial.distance_km != null ? String(initial.distance_km) : '')
    setElevation(initial.elevation_gain_m != null ? String(initial.elevation_gain_m) : '')
    setDuration(initial.estimated_duration_min != null ? String(initial.estimated_duration_min) : '')
    setError(null)
    setGpxError(null)
    setGpxMessage(null)
  }

  async function handleGpxUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setGpxUploading(true)
    setGpxError(null)
    setGpxMessage(null)
    const formData = new FormData()
    formData.append('gpx', file)
    try {
      const response = await fetch(`/api/admin/trails/candidates/${candidateId}/upload-gpx`, {
        method: 'POST',
        body: formData,
      })
      const json = await response.json().catch(() => null) as {
        error?: { message?: string }
        data?: { points?: number; distance_km?: number | null }
      } | null
      if (!response.ok) {
        setGpxError(json?.error?.message ?? 'Upload GPX impossible')
        return
      }
      const pts = json?.data?.points ?? 0
      const dist = json?.data?.distance_km ?? null
      setGpxMessage(`Trace importée avec succès : ${pts} points${dist != null ? ` · ${dist.toFixed(1)} km` : ''}`)
    } finally {
      setGpxUploading(false)
      if (gpxInputRef.current) gpxInputRef.current.value = ''
    }
  }

  function parseNumber(value: string): number | null {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() === '' ? null : description.trim(),
      difficulty: difficulty === '' ? null : difficulty,
      start_label: startLabel.trim() === '' ? null : startLabel.trim(),
      distance_km: parseNumber(distance),
      elevation_gain_m: parseNumber(elevation) == null ? null : Math.round(parseNumber(elevation)!),
      estimated_duration_min: parseNumber(duration) == null ? null : Math.round(parseNumber(duration)!),
    }
    try {
      const response = await fetch(`/api/admin/trails/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
      if (!response.ok) {
        setError(json?.error?.message ?? 'Édition impossible')
        return
      }
      setOpen(false)
      window.location.reload()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) reset()
      }}
    >
      {/* Bouton de déclenchement (Stylé comme dans le tableau) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Pencil size={12} />
        Modifier
      </button>

      <DialogContent className="max-w-2xl bg-white rounded-[25px] border-none shadow-xl p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-neutral-900">Modifier le candidat</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 text-neutral-900">
          
          {/* Titre */}
          <div className="space-y-1.5">
            <label htmlFor="edit-title" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Titre de la randonnée</label>
            <input 
              id="edit-title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full h-[52px] rounded-xl border border-gray-100 bg-[#F4F7FE]/50 px-4 text-[13px] font-bold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="edit-description" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-100 bg-[#F4F7FE]/50 p-4 text-[13px] text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437] resize-y min-h-[100px]"
            />
          </div>

          {/* Lieu de départ & Difficulté */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="edit-start" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Lieu de départ</label>
              <input 
                id="edit-start" 
                value={startLabel} 
                onChange={e => setStartLabel(e.target.value)} 
                className="w-full h-[52px] rounded-xl border border-gray-100 bg-[#F4F7FE]/50 px-4 text-[13px] font-medium text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-difficulty" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Difficulté</label>
              <div className="relative">
                <select
                  id="edit-difficulty"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-[#F4F7FE]/50 px-4 text-[13px] font-medium text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-distance" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Distance (km)</label>
              <input 
                id="edit-distance" 
                type="text" 
                inputMode="decimal" 
                value={distance} 
                onChange={e => setDistance(e.target.value)} 
                className="w-full h-[52px] rounded-xl border border-gray-100 bg-[#F4F7FE]/50 px-4 text-[13px] font-bold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-elevation" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Dénivelé (m)</label>
              <input 
                id="edit-elevation" 
                type="text" 
                inputMode="numeric" 
                value={elevation} 
                onChange={e => setElevation(e.target.value)} 
                className="w-full h-[52px] rounded-xl border border-gray-100 bg-[#F4F7FE]/50 px-4 text-[13px] font-bold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-duration" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Durée (min)</label>
              <input 
                id="edit-duration" 
                type="text" 
                inputMode="numeric" 
                value={duration} 
                onChange={e => setDuration(e.target.value)} 
                className="w-full h-[52px] rounded-xl border border-gray-100 bg-[#F4F7FE]/50 px-4 text-[13px] font-bold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              />
            </div>
          </div>

          {/* Upload GPX Zone */}
          <div className="mt-2 rounded-[16px] border border-dashed border-gray-300 bg-gray-50/50 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-[13px] font-bold text-neutral-900">Tracé GPX</p>
                <p className="mt-0.5 text-[11px] text-gray-500 max-w-sm leading-relaxed">
                  Importer un fichier .gpx (visorando, apidae, perso) pour remplir géométrie et coordonnées de départ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => gpxInputRef.current?.click()}
                disabled={gpxUploading}
                className="flex shrink-0 h-[40px] items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 text-[12px] font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-[#0B1437] disabled:opacity-50"
              >
                <Upload size={14} />
                {gpxUploading ? 'Upload…' : 'Importer GPX'}
              </button>
              <input
                ref={gpxInputRef}
                type="file"
                accept=".gpx,application/gpx+xml,application/xml,text/xml"
                className="hidden"
                onChange={handleGpxUpload}
              />
            </div>
            
            {/* Messages GPX (Succès / Erreur) */}
            {gpxMessage && (
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                <CheckCircle2 size={14} />
                {gpxMessage}
              </div>
            )}
            {gpxError && (
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">
                <AlertCircle size={14} />
                {gpxError}
              </div>
            )}
          </div>

          {/* Erreur de soumission globale */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[12px] font-bold text-rose-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-3 border-t border-gray-50 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={submitting}
            className="flex-1 h-[52px] rounded-xl border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={submitting || title.trim().length < 2}
            className="flex-1 h-[52px] rounded-xl bg-[#0B1437] text-[13px] font-bold text-white hover:bg-gray-900 hover:shadow-md disabled:opacity-50"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}