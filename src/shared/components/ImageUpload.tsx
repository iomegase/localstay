'use client'

import { useRef, useState } from 'react'
import { ACCEPTED_IMAGE_INPUT } from '@/shared/lib/image-upload'
import { prepareImageForUpload, uploadErrorMessage } from '@/shared/lib/prepare-image-upload'

interface Props {
  /** Endpoint POST multipart (champ `file`) renvoyant `{ url }`. */
  endpoint: string
  /** Appelé avec l'URL publique après upload réussi. */
  onUploaded: (url: string) => void
  label?: string
  className?: string
  /** Sélection multiple : nombre maximal d'images par envoi (défaut 1). */
  maxFiles?: number
  /** Appelé une fois avec toutes les URL d'un envoi multiple, dans l'ordre. */
  onUploadedMany?: (urls: string[]) => void
}

/**
 * Bouton de téléversement d'image réutilisable (owner / admin). Convertit côté serveur
 * (png/jpeg/jpg → webp) ; renvoie l'URL publique via `onUploaded` pour remplir un champ.
 */
export function ImageUpload({
  endpoint,
  onUploaded,
  label = 'Téléverser une image',
  className = '',
  maxFiles = 1,
  onUploadedMany,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const multiple = maxFiles > 1

  async function uploadOne(file: File): Promise<string> {
    // Spec 085 : HEIC converti et photo réduite dans le navigateur avant l'envoi.
    const prepared = await prepareImageForUpload(file)
    const body = new FormData()
    body.append('file', prepared)
    const res = await fetch(endpoint, { method: 'POST', body })
    const json = (await res.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null
    if (!res.ok || !json?.url) throw new Error(uploadErrorMessage(res.status, json?.error?.message))
    return json.url
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    if (selected.length === 0) return
    const files = selected.slice(0, Math.max(1, maxFiles))
    setLoading(true)
    setError(null)
    setNotice(
      selected.length > files.length
        ? `Seules les ${files.length} premières images ont été ajoutées.`
        : null,
    )
    const urls: string[] = []
    try {
      // Envois séquentiels : l'ordre de sélection est conservé.
      for (const file of files) urls.push(await uploadOne(file))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Téléversement impossible')
    } finally {
      if (urls.length > 0) {
        if (onUploadedMany) onUploadedMany(urls)
        else urls.forEach(url => onUploaded(url))
      }
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        multiple={multiple}
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
      <p className="mt-1 text-[11px] text-gray-400">
        PNG, JPEG, WebP ou AVIF · max 5 Mo · converti en WebP{multiple ? ` · jusqu’à ${maxFiles} images à la fois` : ''}
      </p>
      {notice && <p className="mt-1 text-[11px] font-medium text-gray-500">{notice}</p>}
      {error && <p className="mt-1 text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  )
}
