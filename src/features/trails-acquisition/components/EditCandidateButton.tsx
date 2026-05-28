'use client'

import { useRef, useState } from 'react'
import { Pencil, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
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
      setGpxMessage(`Trace importée : ${pts} points${dist != null ? ` · ${dist.toFixed(1)} km` : ''}`)
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
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Modifier
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le candidat</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 text-slate-900">
          <div className="space-y-1">
            <Label htmlFor="edit-title">Titre</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="edit-start">Lieu de départ</Label>
              <Input id="edit-start" value={startLabel} onChange={e => setStartLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-difficulty">Difficulté</Label>
              <select
                id="edit-difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                {DIFFICULTIES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="edit-distance">Distance (km)</Label>
              <Input id="edit-distance" type="text" inputMode="decimal" value={distance} onChange={e => setDistance(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-elevation">Dénivelé (m)</Label>
              <Input id="edit-elevation" type="text" inputMode="numeric" value={elevation} onChange={e => setElevation(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-duration">Durée (min)</Label>
              <Input id="edit-duration" type="text" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Tracé GPX</p>
                <p className="text-xs text-slate-500">Importer un fichier .gpx (visorando, apidae, perso) pour remplir géométrie + coords de départ.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => gpxInputRef.current?.click()}
                disabled={gpxUploading}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                {gpxUploading ? 'Upload…' : 'Importer GPX'}
              </Button>
              <input
                ref={gpxInputRef}
                type="file"
                accept=".gpx,application/gpx+xml,application/xml,text/xml"
                className="hidden"
                onChange={handleGpxUpload}
              />
            </div>
            {gpxMessage && <p className="text-xs text-emerald-600">{gpxMessage}</p>}
            {gpxError && <p className="text-xs text-red-600">{gpxError}</p>}
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || title.trim().length < 2}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
