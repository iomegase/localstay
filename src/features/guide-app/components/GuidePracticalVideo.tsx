'use client'

import { useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

/**
 * Lecteur vidéo minimal pour les cards pratiques : uniquement play/pause,
 * sans timeline, son, plein écran ni menu d'options. La première frame de la
 * vidéo sert de poster via le media-fragment `#t=0.1`.
 */
export function GuidePracticalVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  return (
    <div className="group relative aspect-video w-full overflow-hidden bg-slate-900">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={`${src}#t=0.1`}
        preload="metadata"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className={`grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-opacity duration-200 ${
            playing ? 'opacity-0 group-hover:opacity-100 group-active:opacity-100' : 'opacity-100'
          }`}
        >
          {playing ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" aria-hidden="true" />
          )}
        </span>
      </button>
    </div>
  )
}
