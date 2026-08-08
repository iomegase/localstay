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

  return (
    <div className="rounded-2xl bg-slate-800 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
      {/* Mise en page : texte à gauche, vidéo « short » en portrait à droite. */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <p className="text-xs leading-5 text-white/80">{instruction.text}</p>
          </div>

          {instruction.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 pl-10">
              {instruction.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setLightbox({ kind: 'photos', startIndex: i })}
                  className="h-16 w-16 overflow-hidden rounded-xl border border-white/15 transition-transform active:scale-95"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {videoId && (
          <button
            type="button"
            aria-label="Vidéo"
            onClick={() => setLightbox({ kind: 'video' })}
            className="relative aspect-[9/16] w-24 shrink-0 self-stretch overflow-hidden rounded-2xl border border-white/10 transition-transform active:scale-95 sm:w-28"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youTubeThumbnailUrl(videoId)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/25">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg">
                <Play className="h-5 w-5 translate-x-0.5 fill-current" aria-hidden="true" />
              </span>
            </span>
          </button>
        )}
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
