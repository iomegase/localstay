'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import type { GuideArrivalInstruction } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from './GuideDarkMarkdown'
import { MediaLightbox } from './MediaLightbox'

type Lightbox =
  | { kind: 'photos'; startIndex: number }
  | { kind: 'video' }
  | null

function splitInstructionText(source: string, index: number): { title: string; body: string } {
  const normalized = source.replace(/^(#{1,3})(?!#)(?=\S)/, '$1 ')
  const heading = normalized.match(/^\s*#{1,3}\s+(.+?)\s*(?:\r?\n|$)/)

  if (!heading) {
    return { title: `Instruction ${index + 1}`, body: source }
  }

  return {
    title: heading[1].replace(/\s+#+\s*$/, '').trim(),
    body: normalized.slice(heading[0].length).trimStart(),
  }
}

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
  const { title, body } = splitInstructionText(instruction.text, index)

  return (
    <div className="rounded-2xl bg-slate-800 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
      <div data-testid="arrival-instruction-header" className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white">
          {index + 1}
        </span>
        <h3 className="min-w-0 text-sm font-bold uppercase tracking-[0.14em] text-white">
          {title}
        </h3>
      </div>

      {body && (
        <div data-testid="arrival-instruction-content" className="mt-3 min-w-0">
          <GuideDarkMarkdown source={body} />
        </div>
      )}

      {(instruction.photos.length > 0 || videoId) && (
        <div data-testid="arrival-instruction-media" className="mt-3 flex flex-wrap gap-2">
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
          {videoId && (
            <button
              type="button"
              aria-label="Vidéo"
              onClick={() => setLightbox({ kind: 'video' })}
              className="relative aspect-[9/16] h-16 overflow-hidden rounded-xl border border-white/15 transition-transform active:scale-95"
            >
              {/* Conteneur portrait 9:16 → object-cover recadre les bandes noires du thumbnail 16:9. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={youTubeThumbnailUrl(videoId)}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/30">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-slate-900">
                  <Play className="h-3 w-3 translate-x-0.5 fill-current" aria-hidden="true" />
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
    </div>
  )
}
