'use client'

import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'

interface Props {
  label: string
  value: string | null
  onChange: (next: string | null) => void
  id?: string
}

/**
 * Champ de saisie d'un lien YouTube avec validation inline et aperçu miniature.
 * Renvoie null quand le champ est vide.
 */
export function YouTubeUrlField({ label, value, onChange, id }: Props) {
  const raw = value ?? ''
  const trimmed = raw.trim()
  const videoId = trimmed === '' ? null : extractYouTubeId(trimmed)
  const isInvalid = trimmed !== '' && videoId === null

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </Label>
      <Input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://www.youtube.com/watch?v=…"
        value={raw}
        onChange={event => {
          const next = event.target.value
          onChange(next.trim() === '' ? null : next)
        }}
        aria-invalid={isInvalid}
      />
      {isInvalid && (
        <p className="text-[11px] font-medium text-red-500">Lien YouTube invalide</p>
      )}
      {videoId && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={youTubeThumbnailUrl(videoId)}
          alt="Aperçu de la vidéo"
          className="h-20 w-32 rounded-lg object-cover"
        />
      )}
    </div>
  )
}
