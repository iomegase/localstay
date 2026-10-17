'use client'

import { useEffect, useState } from 'react'
import type { GooglePlacePhoto } from '../services/place-photos'

/**
 * Spec 103 AC-01-01/03/04 : photos Google Maps chargées dans le navigateur à chaque affichage, avec
 * leurs auteurs. Rien ne s'affiche tant qu'elles ne sont pas là, ni en cas d'échec.
 */
export function GooglePlacePhotos({
  poiRef,
  name,
  label,
  className,
}: {
  poiRef: string
  name: string
  label: string
  className?: string
}) {
  const [photos, setPhotos] = useState<GooglePlacePhoto[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/places/photos?poi=${encodeURIComponent(poiRef)}`, { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : null))
      .then((payload: { data?: { photos?: GooglePlacePhoto[] } } | null) => {
        if (!cancelled) setPhotos(payload?.data?.photos ?? [])
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [poiRef])

  if (photos.length === 0) return null
  const authors = [...new Map(photos.flatMap(photo => photo.authors).map(author => [author.name, author])).values()]

  return (
    <div data-testid="google-place-photos" className={className}>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <a key={photo.url} href={photo.url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL Google temporaire, jamais optimisée ni stockée */}
            <img src={photo.url} alt={`${name} — photo ${index + 1}`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        {label}{' '}
        {authors.map((author, index) => (
          <span key={author.name}>
            {index > 0 ? ' · ' : null}
            {author.uri ? (
              <a href={author.uri} target="_blank" rel="nofollow noopener noreferrer" className="underline underline-offset-2">{author.name}</a>
            ) : author.name}
          </span>
        ))}
        {authors.length > 0 ? ' — ' : null}Google Maps
      </p>
    </div>
  )
}
