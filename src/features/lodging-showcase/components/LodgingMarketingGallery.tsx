'use client'

import Image from 'next/image'
import { useState } from 'react'
import { selectLodgingGalleryPhotos } from '../lib/detail-view'
import { LodgingPhotoLightbox } from './LodgingPhotoLightbox'

type GalleryPhoto = {
  id: string
  url: string
  alt: string
}

export function LodgingMarketingGallery({
  title,
  photos,
  compact = false,
}: {
  title: string
  photos: GalleryPhoto[]
  compact?: boolean
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const visiblePhotos = selectLodgingGalleryPhotos(photos)

  if (visiblePhotos.length === 0) {
    return (
      <section
        aria-label={`Photos de ${title}`}
        data-testid="lodging-marketing-gallery"
        className="mx-auto flex min-h-[280px] w-full max-w-[944px] items-center justify-center bg-slate-100 text-sm text-slate-500 md:min-h-[420px] md:rounded-[26px]"
      >
        Photos à venir
      </section>
    )
  }

  const [mainPhoto, ...secondaryPhotos] = visiblePhotos
  // Spec 091 AC-01 / AC-04 : chaque photo ouvre la lightbox sur toutes les photos du logement.
  const zoomClass = 'absolute inset-0 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white'

  return (
    <>
    <section
      aria-label={`Photos de ${title}`}
      data-testid="lodging-marketing-gallery"
      className={compact
        ? 'mx-auto grid h-[440px] w-full max-w-[944px] grid-cols-2 grid-rows-[2fr_1fr] gap-1.5 overflow-hidden'
        : 'mx-auto grid h-[440px] w-full max-w-[944px] grid-cols-2 grid-rows-[2fr_1fr] gap-1.5 overflow-hidden md:h-[520px] md:grid-cols-[1.7fr_0.85fr] md:grid-rows-2 md:gap-3 md:rounded-[26px] xl:h-[560px]'}
    >
      <div className={compact
        ? 'relative col-span-2 overflow-hidden'
        : 'relative col-span-2 overflow-hidden md:col-span-1 md:row-span-2'}>
        <Image
          src={mainPhoto.url}
          alt={mainPhoto.alt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1280px) 630px, (min-width: 768px) 66vw, 100vw"
          className="object-cover"
        />
        <button type="button" className={zoomClass} aria-label={`Agrandir la photo : ${mainPhoto.alt}`} onClick={() => setOpenIndex(0)} />
      </div>

      {secondaryPhotos.map((photo, photoIndex) => (
        <div
          key={photo.id}
          className="relative overflow-hidden bg-slate-100"
        >
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 32vw, 50vw"
            className="object-cover"
          />
          <button type="button" className={zoomClass} aria-label={`Agrandir la photo : ${photo.alt}`} onClick={() => setOpenIndex(photoIndex + 1)} />
        </div>
      ))}

      {secondaryPhotos.length === 0 && (
        <div className="relative overflow-hidden bg-slate-100">
          <Image
            src={mainPhoto.url}
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
          />
          <button type="button" className={zoomClass} aria-label={`Agrandir la photo : ${mainPhoto.alt}`} onClick={() => setOpenIndex(0)} />
        </div>
      )}
    </section>
    {openIndex !== null && (
      <LodgingPhotoLightbox photos={photos} startIndex={openIndex} title={title} onClose={() => setOpenIndex(null)} />
    )}
    </>
  )
}
