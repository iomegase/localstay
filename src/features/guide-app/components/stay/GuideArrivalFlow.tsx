'use client'

import { useState } from 'react'
import { Check, Copy, Map, Play } from 'lucide-react'
import { ARRIVAL_STEP_KIND_LABELS } from '@/features/guide-app/lib/arrival-steps'
import type { GuideArrivalInstruction, GuideLodging } from '@/features/guide-app/types'
import { formatFrenchWelcomeLine } from '@/shared/lib/french-place'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '../GuideDarkMarkdown'
import { MediaLightbox, type LightboxContent } from '../MediaLightbox'
import { GuideStayScreen } from './GuideStayScreen'
import {
  formatGuideHour,
  lodgingMapsHref,
  STAY_EYEBROW,
  STAY_PRIMARY_BUTTON,
} from './stay-styles'
import { copyToClipboard, useTemporaryFlag } from './useTemporaryFlag'

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

function stepLabel(step: GuideArrivalInstruction): string {
  return step.title?.trim() || ARRIVAL_STEP_KIND_LABELS[step.kind]
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
    <GuideStayScreen title="Arrivée" subtitle={`Dès ${formatGuideHour(lodging.checkIn)}`} onBack={onBack}>
      <div
        role="tablist"
        aria-label="Étapes d'arrivée"
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
                {done ? <Check className="h-3 w-3" aria-label="Validée" /> : index + 1}
              </span>
              <span className="max-w-full truncate">{stepLabel(item)}</span>
            </button>
          )
        })}
      </div>

      <article key={current} role="tabpanel" className="mt-3 overflow-hidden rounded-3xl bg-white">
        <StepMedia step={step} />
        <div className="p-5">
          <p className={STAY_EYEBROW}>
            Étape {current + 1} sur {steps.length}
          </p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">{stepLabel(step)}</h2>
          {step.text ? (
            <div className="mt-2 text-[14px] leading-[1.5] text-[#697386]">
              <GuideDarkMarkdown source={step.text} />
            </div>
          ) : null}

          {step.kind === 'address' && <AddressBlock lodging={lodging} />}
          {step.kind === 'access' && lodging.keyBoxCode && <KeyBoxCode code={lodging.keyBoxCode} />}

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
              <p className="text-[12px] font-semibold uppercase text-pink-600tracking-[0.06em] ">Infos  </p>
              <p className="mt-1 text-xs">{step.tip}</p>
            </aside>
          ) : null}

          {step.kind === 'access' && arrived && (
            <div className="mt-5 rounded-[22px] bg-[#111111] p-5 text-white" role="status">
              <p className="text-[20px] font-semibold">{formatFrenchWelcomeLine(lodging.name)} !</p>
              <p className="mt-1 text-[14px] text-[#FBCFE8]">La conciergerie a été prévenue de votre arrivée.</p>
            </div>
          )}
        </div>
      </article>

      {step.kind === 'address' && !demo && (
        <a
          href={lodgingMapsHref(lodging.latitude, lodging.longitude)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-4 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-[0_7px_16px_rgba(17,24,39,0.07)] transition-[transform,box-shadow] hover:shadow-[0_9px_20px_rgba(17,24,39,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:scale-[0.98]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
            <Map className="h-4 w-4" aria-hidden="true" />
          </span>
          Ouvrir dans Maps
        </a>
      )}
      {step.kind === 'access' && !arrived && (
        <button
          type="button"
          disabled={sending}
          onClick={signalArrival}
          className={`${STAY_PRIMARY_BUTTON} mt-4 w-full bg-[#DB2777] disabled:opacity-60`}
        >
          Je suis arrivé·e !
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
            aria-label="Photo 1"
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
              aria-label={`Photo ${index + 2}`}
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
        <MediaLightbox title={stepLabel(step)} content={lightbox} onClose={() => setLightbox(null)} />
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
  return (
    <button
      type="button"
      aria-label="Lire la vidéo"
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

function AddressBlock({ lodging }: { lodging: GuideLodging }) {
  const [copied, flagCopied] = useTemporaryFlag(1600)
  const [street, ...localityParts] = lodging.addressLabel.split(',')
  const locality = localityParts.join(',').trim()

  async function copyAddress() {
    if (await copyToClipboard(lodging.addressLabel)) flagCopied()
  }

  return (
    <div className="mt-4">
      <div data-testid="arrival-address" className="flex items-center justify-between gap-3 rounded-2xl shadow-md bg-white p-4 text-slate-600">
        <address className="min-w-0 break-words text-[12px] tracking-wide leading-snug not-italic">
          <span className="block">{street.trim()}</span>
          {locality && <span className="block">{locality}</span>}
        </address>
        <button
          type="button"
          onClick={copyAddress}
          aria-label={copied ? 'Adresse copiée' : "Copier l'adresse"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#DB2777] transition-colors hover:bg-[#FCE7F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
        >
          {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function KeyBoxCode({ code }: { code: string }) {
  const [shown, setShown] = useState(false)

  return (
    <div className="mt-4 rounded-[22px] bg-[#111111] p-5 text-white">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F9A8D4]">Code de la boîte à clés</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span data-testid="guide-key-box-code" className="font-mono text-[32px] font-semibold tracking-[0.3em]">
          {shown ? code : '••••'}
        </span>
        <button
          type="button"
          onClick={() => setShown(value => !value)}
          className="flex h-11 shrink-0 items-center rounded-full bg-[#DB2777] px-4 text-[14px] font-semibold"
        >
          {shown ? 'Masquer' : 'Afficher le code'}
        </button>
      </div>
    </div>
  )
}

export function SignalError() {
  return (
    <p role="alert" className="mt-3 text-center text-[13px] text-[#B3261E]">
      Le signal n&apos;a pas pu être envoyé. Vérifiez votre connexion et réessayez.
    </p>
  )
}
