'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { extractYouTubeId, youTubeEmbedUrl, youTubeThumbnailUrl } from '@/shared/lib/youtube'

type Props = {
  url: string
  title: string
  className?: string
  /** Masque l'habillage YouTube (contrôles, roue, volume, CC, titre/chaîne, branding). */
  chromeless?: boolean
  /** Démarre la vidéo sans le son. */
  muted?: boolean
}

/**
 * Lecteur YouTube « click-to-load » : affiche d'abord la miniature (aucun cookie
 * ni JS YouTube chargé), puis remplace par l'iframe sans cookie au clic.
 */
export function YouTubeEmbed({ url, title, className, chromeless = false, muted = false }: Props) {
  const [playing, setPlaying] = useState(false)
  const videoId = extractYouTubeId(url)

  if (!videoId) return null

  const params = [
    'autoplay=1',
    muted ? 'mute=1' : null,
    chromeless ? 'controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&disablekb=1&fs=0' : null,
  ]
    .filter(Boolean)
    .join('&')

  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-black ${className ?? ''}`}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`${youTubeEmbedUrl(videoId)}?${params}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Lire la vidéo : ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumbnailUrl(videoId)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 translate-x-0.5 fill-current text-[#1A1D1F]" />
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
