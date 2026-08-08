'use client'

import { useEffect, useRef, useState } from 'react'
import { extractYouTubeId } from '@/shared/lib/youtube'

type YTPlayer = {
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  mute: () => void
  playVideo: () => void
  destroy?: () => void
}

type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer
}

function ytWindow() {
  return window as unknown as {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null

/** Charge l'API IFrame YouTube une seule fois. */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = ytWindow()
  if (w.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise(resolve => {
    const previous = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

/**
 * Lecteur « short » piloté par l'API IFrame : autoplay muet, habillage YouTube
 * masqué (pas de roue/volume/CC/titre), et une **barre de progression maison**
 * (avec scrub) — la seule commande exposée, sans réactiver le son.
 */
export function ShortVideoPlayer({ url }: { url: string }) {
  const videoId = extractYouTubeId(url)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const draggingRef = useRef(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    let raf = 0

    void loadYouTubeApi().then(() => {
      const w = ytWindow()
      if (cancelled || !hostRef.current || !w.YT) return

      playerRef.current = new w.YT.Player(hostRef.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            event.target.mute()
            event.target.playVideo()
          },
        },
      })

      const tick = () => {
        const player = playerRef.current
        if (player && typeof player.getDuration === 'function') {
          const duration = player.getDuration()
          if (duration > 0 && !draggingRef.current) {
            setProgress(Math.min(1, player.getCurrentTime() / duration))
          }
        }
        raf = window.requestAnimationFrame(tick)
      }
      raf = window.requestAnimationFrame(tick)
    })

    return () => {
      cancelled = true
      if (raf) window.cancelAnimationFrame(raf)
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [videoId])

  function seekFromClientX(clientX: number, bar: HTMLElement) {
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setProgress(ratio)
    const player = playerRef.current
    const duration = player?.getDuration?.() ?? 0
    if (player && duration > 0) player.seekTo(ratio * duration, true)
  }

  if (!videoId) return null

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden bg-black [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0">
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />

      <div
        role="slider"
        aria-label="Progression de la vidéo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        onPointerDown={event => {
          draggingRef.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          seekFromClientX(event.clientX, event.currentTarget)
        }}
        onPointerMove={event => {
          if (draggingRef.current) seekFromClientX(event.clientX, event.currentTarget)
        }}
        onPointerUp={event => {
          draggingRef.current = false
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        className="absolute inset-x-3 bottom-3 z-10 flex h-5 cursor-pointer touch-none items-center"
      >
        <div className="relative h-1 w-full rounded-full bg-white/30">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            style={{ width: `${progress * 100}%` }}
          />
          <span
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
