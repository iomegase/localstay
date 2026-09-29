'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import type { GuideArrivalInstruction } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from './GuideDarkMarkdown'
import { MediaLightbox } from './MediaLightbox'
import { GUIDE_CARD, GuideCardHeading } from './GuideCard'

type Lightbox =
  | { kind: 'photos'; startIndex: number }
  | { kind: 'video' }
  | null

function splitInstructionText(
  source: string,
  index: number,
  overrideTitle?: string | null,
): { title: string; body: string } {
  const normalized = source.replace(/^(#{1,3})(?!#)(?=\S)/, '$1 ')
  const heading = normalized.match(/^\s*#{1,3}\s+(.+?)\s*(?:\r?\n|$)/)

  if (overrideTitle && overrideTitle.trim().length > 0) {
    return { title: overrideTitle.trim(), body: source }
  }

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
  const { title, body } = splitInstructionText(instruction.text, index, instruction.title)

  return (
    <article data-testid="guide-arrival-instruction" data-guide-card="true" className={GUIDE_CARD}>
      <div data-testid="arrival-instruction-header">
        <GuideCardHeading step={index + 1} tone="step" as="h3" title={title} />
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
              className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 transition-transform active:scale-95"
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
              className="relative aspect-[9/16] h-16 overflow-hidden rounded-xl border border-slate-200 transition-transform active:scale-95"
            >
              {/* Conteneur portrait 9:16 → object-cover recadre les bandes noires du thumbnail 16:9. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={youTubeThumbnailUrl(videoId)}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/30">
                <span data-guide-pastille="true" className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-slate-900">
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
    </article>
  )
}
