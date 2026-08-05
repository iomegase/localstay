'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import type { GuideArrivalInstruction } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { MediaLightbox } from './MediaLightbox'

type Lightbox =
  | { kind: 'photos'; startIndex: number }
  | { kind: 'video' }
  | null

/** Mini-card numérotée d'une instruction d'arrivée : texte + vignettes → lightbox. */
export function ArrivalInstructionCard({
  index,
  instruction,
}: {
  index: number
  instruction: GuideArrivalInstruction
}) {
  const [lightbox, setLightbox] = useState<Lightbox>(null)
  const videoId = instruction.videoUrl
    ? extractYouTubeId(instruction.videoUrl)
    : null
  const hasMedia = instruction.photos.length > 0 || Boolean(videoId)

  return (
    <div className="rounded-2xl bg-slate-800 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-5 text-white/80">{instruction.text}</p>

          {hasMedia && (
            <div className="mt-3 flex flex-wrap gap-2">
              {instruction.photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => setLightbox({ kind: 'photos', startIndex: i })}
              className="h-16 w-20 overflow-hidden rounded-xl border border-white/15 transition-transform active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {videoId && (
            <button
              type="button"
              aria-label="Vidéo"
              onClick={() => setLightbox({ kind: 'video' })}
              className="relative h-16 w-20 overflow-hidden rounded-xl border border-white/15 transition-transform active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={youTubeThumbnailUrl(videoId)}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/30">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-900">
                  <Play className="h-3.5 w-3.5 translate-x-0.5 fill-current" aria-hidden="true" />
                </span>
              </span>
            </button>
              )}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <MediaLightbox
          title={`Instruction ${index + 1}`}
          content={
            lightbox.kind === 'photos'
              ? {
                  kind: 'photos',
                  photos: instruction.photos,
                  startIndex: lightbox.startIndex,
                }
              : { kind: 'video', url: instruction.videoUrl as string }
          }
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
