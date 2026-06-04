'use client'

import { useRef, useState } from 'react'
import { ACCEPTED_IMAGE_UPLOAD_MIMES } from '@/shared/lib/image-upload'

interface Props {
  /** Endpoint POST multipart (champ `file`) renvoyant `{ url }`. */
  endpoint: string
  /** Appelé avec l'URL publique après upload réussi. */
  onUploaded: (url: string) => void
  label?: string
  className?: string
}

/**
 * Bouton de téléversement d'image réutilisable (owner / admin). Convertit côté serveur
 * (png/jpeg/jpg → webp) ; renvoie l'URL publique via `onUploaded` pour remplir un champ.
 */
export function ImageUpload({ endpoint, onUploaded, label = 'Téléverser une image', className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch(endpoint, { method: 'POST', body })
      const json = (await res.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null
      if (!res.ok || !json?.url) {
        setError(json?.error?.message ?? 'Téléversement impossible')
        return
      }
      onUploaded(json.url)
    } catch {
      setError('Téléversement impossible')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_UPLOAD_MIMES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[12px] font-bold text-[#0B1437] transition-colors hover:border-[#0B1437]/30 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Téléversement…' : label}
      </button>
      <p className="mt-1 text-[11px] text-gray-400">PNG, JPEG, WebP ou AVIF · max 5 Mo · converti en WebP</p>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  )
}
