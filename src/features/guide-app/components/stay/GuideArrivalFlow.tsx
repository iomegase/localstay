'use client'

import { useState, type ReactNode } from 'react'
import { Check, Play } from 'lucide-react'
import type { GuideArrivalInstruction, GuideLodging } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '../GuideDarkMarkdown'
import { MediaLightbox, type LightboxContent } from '../MediaLightbox'
import { GuideStayScreen } from './GuideStayScreen'
import {
  formatGuideHour,
  lodgingMapsHref,
  STAY_PRIMARY_BUTTON,
} from './stay-styles'
import { GuideAddressBlock } from './GuideAddressBlock'
import { useGuideI18n, useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

// Sans étape saisie, l'adresse reste le minimum utile (spec 054 AC-02-02).
const FALLBACK_STEP: GuideArrivalInstruction = {
  title: 'Adresse',
  text: '',
  videoUrl: null,
  photos: [],
  kind: 'address',
  tip: null,
  substeps: [],
  facts: [],
}

function stepLabel(step: GuideArrivalInstruction, kinds: Record<GuideArrivalInstruction['kind'], string>): string {
  return step.title?.trim() || kinds[step.kind]
}

/** Parcours d'arrivée étape par étape (spec 054 US-02). */
export function GuideArrivalFlow({
  lodging,
  arrived,
  onArrived,
  onBack,
  demo = false,
}: {
  lodging: GuideLodging
  arrived: boolean
  onArrived: () => Promise<void>
  onBack: () => void
  /** Démo (spec 045) : pas de lien externe vers Maps. */
  demo?: boolean
}) {
  const { locale, messages: m } = useGuideI18n()
  const steps = lodging.arrivalInstructions.length > 0 ? lodging.arrivalInstructions : [FALLBACK_STEP]
  const [current, setCurrent] = useState(0)
  const [visited, setVisited] = useState<Set<number>>(() => new Set())
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const step = steps[current]

  function goTo(index: number) {
    setVisited(previous => new Set(previous).add(current))
    setCurrent(index)
  }

  async function signalArrival() {
    setSending(true)
    setFailed(false)
    try {
      await onArrived()
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <GuideStayScreen title={m.arrival.title} subtitle={m.home.arrivalFrom(formatGuideHour(lodging.checkIn, locale))} onBack={onBack}>
      <div
        role="tablist"
        aria-label={m.arrival.steps}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, minmax(0, 1fr))` }}
      >
        {steps.map((item, index) => {
          const active = index === current
          const done = !active && (visited.has(index) || (arrived && item.kind === 'access'))
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => goTo(index)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 shadow-md rounded-2xl px-1 text-[12px] font-semibold ${
                active ? 'bg-[#111111] text-white' : ' bg-white text-[#111111]'
              }`}
            >
              <span
                className={`grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] ${
                  active || done ? 'bg-[#DB2777] text-white' : 'bg-[#FCE7F3] text-[#BE185D]'
                }`}
              >
                {done ? <Check className="h-3 w-3" aria-label={m.arrival.stepDone} /> : index + 1}
              </span>
              <span className="max-w-full truncate">{stepLabel(item, m.arrival.kinds)}</span>
            </button>
          )
        })}
      </div>

      <article key={current} role="tabpanel" className="mt-3 overflow-hidden rounded-3xl bg-white">
        <StepMedia step={step} />
        <div className="p-5">
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">{stepLabel(step, m.arrival.kinds)}</h2>
          {step.text ? (
            <div className="mt-2 text-[14px] leading-[1.5] text-[#697386]">
              <GuideDarkMarkdown source={step.text} />
            </div>
          ) : null}

          {step.kind === 'address' && (
            <GuideAddressBlock lodging={lodging} mapsHref={demo ? null : lodgingMapsHref(lodging.latitude, lodging.longitude)} />
          )}
          {step.kind === 'access' && lodging.keyBoxCode && (
            <KeyBoxCode
              code={lodging.keyBoxCode}
              action={!arrived ? (
                <button
                  type="button"
                  disabled={sending}
                  onClick={signalArrival}
                  className="flex h-11 shrink-0 items-center rounded-full bg-[#DB2777] px-4 text-[14px] font-semibold disabled:opacity-60"
                >
                  {m.arrival.imArrived}
                </button>
              ) : null}
            />
          )}

          {step.facts.length > 0 && (
            <dl className="mt-4 grid grid-cols-3 gap-2">
              {step.facts.map((fact, index) => (
                <div key={index} className="flex flex-col-reverse rounded-2xl bg-[#F6F6F4] p-3">
                  <dt className="text-[11px] text-[#697386]">{fact.label}</dt>
                  <dd className="text-[15px] font-semibold text-[#111111]">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {step.substeps.length > 0 && (
            <ol className="mt-5 grid gap-4">
              {step.substeps.map((substep, index) => (
                <li key={index} className="flex gap-3 mt-2">
                  <span className="grid shrink-0 place-items-center text-[35px] font-semibold text-slate-500 [text-shadow:0_2px_4px_rgba(15,23,42,0.3)]">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-[#111111]">{substep.title}</span>
                    {substep.detail ? (
                      <span className="mt-0.5 block text-xs leading-[1.5] text-[#697386]">{substep.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {step.tip ? (
            <aside className="mt-5 rounded-[14px] border-2 border-pink-600 p-4 text-[14px] leading-[1.5] text-[#111111]">
              <p className="text-[12px] font-semibold uppercase text-pink-600tracking-[0.06em] ">{m.arrival.tip}</p>
              <p className="mt-1 text-xs">{step.tip}</p>
            </aside>
          ) : null}

          {step.kind === 'access' && arrived && (
            <div className="mt-5 rounded-[22px] bg-[#111111] p-5 text-white" role="status">
              <p className="text-[20px] font-semibold">{m.arrival.welcomeLine(lodging.name)}</p>
              <p className="mt-1 text-[14px] text-[#FBCFE8]">{m.arrival.conciergeNotified}</p>
            </div>
          )}
        </div>
      </article>

      {/* Avec un code de boîte à clés, le bouton est dans la carte du code (amendement 054 AC-02-03). */}
      {step.kind === 'access' && !arrived && !lodging.keyBoxCode && (
        <button
          type="button"
          disabled={sending}
          onClick={signalArrival}
          className={`${STAY_PRIMARY_BUTTON} mt-4 w-full bg-[#DB2777] disabled:opacity-60`}
        >
          {m.arrival.imArrived}
        </button>
      )}
      {failed && <SignalError />}
    </GuideStayScreen>
  )
}

/**
 * Médias d'une étape (spec 054 AC-02-05) : première photo en image principale,
 * autres photos puis vidéo dessous sur 4 colonnes ; sans photo, la vidéo
 * devient l'image principale.
 */
function StepMedia({ step }: { step: GuideArrivalInstruction }) {
  const m = useGuideMessages()
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null)
  const videoId = step.videoUrl ? extractYouTubeId(step.videoUrl) : null
  const video = videoId && step.videoUrl ? { id: videoId, url: step.videoUrl } : null
  if (!video && step.photos.length === 0) return null

  const openPhoto = (index: number) => setLightbox({ kind: 'photos', photos: step.photos, startIndex: index })
  const openVideo = () => video && setLightbox({ kind: 'video', url: video.url })
  const heroIsPhoto = step.photos.length > 0
  const secondaryPhotos = heroIsPhoto ? step.photos.slice(1) : []
  const secondaryCount = secondaryPhotos.length + (heroIsPhoto && video ? 1 : 0)

  return (
    <div className="grid gap-1.5 p-1.5">
      <div data-testid="arrival-step-hero">
        {heroIsPhoto ? (
          <button
            type="button"
            aria-label={m.media.photo(1)}
            onClick={() => openPhoto(0)}
            className="block h-[210px] w-full overflow-hidden rounded-[18px] bg-[#E8E6E2]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={step.photos[0]} alt="" className="h-full w-full object-cover" />
          </button>
        ) : video ? (
          <VideoTile videoId={video.id} onOpen={openVideo} className="h-[200px] w-full rounded-[18px]" large />
        ) : null}
      </div>

      {secondaryCount > 0 ? (
        <div
          data-testid="arrival-step-media-grid"
          // Toujours 4 colonnes : vignettes compactes quel que soit leur nombre.
          className="grid grid-cols-4 gap-1.5"
        >
          {secondaryPhotos.map((photo, index) => (
            <button
              key={index}
              type="button"
              aria-label={m.media.photo(index + 2)}
              onClick={() => openPhoto(index + 1)}
              className="aspect-square overflow-hidden rounded-[14px] bg-[#E8E6E2]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {heroIsPhoto && video ? (
            <VideoTile videoId={video.id} onOpen={openVideo} className="aspect-square rounded-[14px]" />
          ) : null}
        </div>
      ) : null}

      {lightbox && (
        <MediaLightbox title={stepLabel(step, m.arrival.kinds)} content={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

function VideoTile({
  videoId,
  onOpen,
  className,
  large = false,
}: {
  videoId: string
  onOpen: () => void
  className: string
  large?: boolean
}) {
  const m = useGuideMessages()
  return (
    <button
      type="button"
      aria-label={m.media.playVideo}
      onClick={onOpen}
      className={`relative overflow-hidden bg-[#E8E6E2] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={youTubeThumbnailUrl(videoId)} alt="" className="h-full w-full object-cover" />
      <span className="absolute inset-0 grid place-items-center bg-black/20">
        <span
          className={`grid place-items-center rounded-full bg-white text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.15)] ${
            large ? 'h-14 w-14' : 'h-9 w-9'
          }`}
        >
          <Play className={`${large ? 'h-5 w-5' : 'h-3.5 w-3.5'} translate-x-0.5 fill-current`} aria-hidden="true" />
        </span>
      </span>
    </button>
  )
}


// Spec 054 AC-02-03 (amendé PO 2026-10-06) : code toujours affiché ; « Je suis arrivé·e ! » à côté.
function KeyBoxCode({ code, action }: { code: string; action: ReactNode }) {
  const m = useGuideMessages()

  return (
    <div data-testid="guide-key-box-card" className="mt-4 rounded-[22px] bg-[#111111] p-5 text-white">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F9A8D4]">{m.arrival.keyBoxCode}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span data-testid="guide-key-box-code" className="font-mono text-[32px] font-semibold tracking-[0.3em]">
          {code}
        </span>
        {action}
      </div>
    </div>
  )
}

export function SignalError() {
  const m = useGuideMessages()
  return (
    <p role="alert" className="mt-3 text-center text-[13px] text-[#B3261E]">
      {m.arrival.signalError}
    </p>
  )
}
