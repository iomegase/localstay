'use client'

import { useRef } from 'react'
import type { PointerEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

const DIGITS = [
  { src: '/404/4_first.png', alt: '4' },
  { src: '/404/0.png', alt: '0' },
  { src: '/404/4_last.png', alt: '4' },
] as const

type Mover = {
  x: (value: number) => void
  y: (value: number) => void
  rotation: (value: number) => void
}

/** Scène animée de la 404 du site : chiffres illustrés, message et retour à l'accueil. */
export function NotFoundScene() {
  const containerRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const moversRef = useRef<Mover[]>([])

  useGSAP(
    () => {
      const elements = gsap.utils.toArray<HTMLElement>('[data-digit]')
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reducedMotion) {
        gsap.set([...elements, '.error-text', '.home-link', '.replay'], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
        })
        return
      }

      // Animation principale
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        elements[0],
        { y: -180, rotation: -16, autoAlpha: 0 },
        { y: 0, rotation: 0, autoAlpha: 1, duration: 1.25, ease: 'back.out(1.45)' },
        0,
      )

      tl.fromTo(
        elements[1],
        { y: 130, rotation: -24, scale: 0.7, autoAlpha: 0 },
        { y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 1.4, ease: 'back.out(1.5)' },
        0.15,
      )

      tl.fromTo(
        elements[2],
        { y: 200, rotation: 18, autoAlpha: 0 },
        { y: 0, rotation: 0, autoAlpha: 1, duration: 1.3, ease: 'back.out(1.5)' },
        0.3,
      )

      // Apparition du texte et du bouton
      tl.fromTo(
        ['.error-text', '.home-link', '.replay'],
        { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12 },
        1.05,
      )

      timelineRef.current = tl

      // Mouvement magnétique doux
      moversRef.current = elements.map(element => ({
        x: gsap.quickTo(element, 'x', { duration: 0.8, ease: 'power3.out' }),
        y: gsap.quickTo(element, 'y', { duration: 0.8, ease: 'power3.out' }),
        rotation: gsap.quickTo(element, 'rotation', { duration: 0.9, ease: 'power3.out' }),
      }))

      return () => {
        moversRef.current = []
        timelineRef.current = null
      }
    },
    { scope: containerRef },
  )

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    if (!timelineRef.current?.progress() || timelineRef.current.isActive()) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    moversRef.current.forEach((mover, index) => {
      const direction = index === 1 ? -1 : 1

      mover.x(x * 28 * direction)
      mover.y(y * 18 * direction)
      mover.rotation(x * 4 * direction)
    })
  }

  const handlePointerLeave = () => {
    moversRef.current.forEach(mover => {
      mover.x(0)
      mover.y(0)
      mover.rotation(0)
    })
  }

  const replay = () => {
    handlePointerLeave()
    timelineRef.current?.restart()
  }

  return (
    <main
      ref={containerRef}
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-white px-4 text-slate-900"
    >
      <div className="flex w-full max-w-6xl flex-col items-center">
        {/* Illustration 404 */}
        <div
          className="flex w-full items-center justify-center"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {DIGITS.map(digit => (
            <div
              key={digit.src}
              data-digit
              className="relative aspect-square w-1/3 max-w-[380px] shrink-0 opacity-0 will-change-transform"
            >
              <Image
                src={digit.src}
                alt={digit.alt}
                fill
                preload
                sizes="(max-width: 768px) 33vw, 380px"
                className="pointer-events-none select-none object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="mt-6 flex flex-col items-center gap-6 text-center md:mt-10">
          <p className="error-text text-base font-medium tracking-[-0.02em] opacity-0 md:text-xl">
            Cette page s&apos;est égarée.
          </p>

          {/* L'opacité animée par GSAP reste sur l'enveloppe : en ligne, elle neutraliserait le survol du lien. */}
          <div className="home-link opacity-0">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 border-b border-slate-900 pb-2 text-sm font-medium transition-opacity hover:opacity-50"
            >
              Retour à l&apos;accueil
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Rejouer l'animation */}
      <button
        type="button"
        onClick={replay}
        aria-label="Rejouer l'animation"
        className="replay absolute bottom-6 right-6 cursor-pointer text-xs text-slate-400 opacity-0 transition-colors hover:text-slate-900 md:bottom-10 md:right-10"
      >
        Rejouer ↻
      </button>
    </main>
  )
}
