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
    <article className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
          {index + 1}
        </span>
        <p className="pt-0.5 text-xs leading-5 text-slate-600">{instruction.text}</p>
      </div>

      {hasMedia && (
        <div className="mt-3 flex flex-wrap gap-2 pl-10">
          {instruction.photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => setLightbox({ kind: 'photos', startIndex: i })}
              className="h-16 w-20 overflow-hidden rounded-xl border border-slate-100 transition-transform active:scale-95"
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
              className="relative h-16 w-20 overflow-hidden rounded-xl border border-slate-100 transition-transform active:scale-95"
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
    </article>
  )
}
