'use client'

/* eslint-disable @next/next/no-img-element -- Spec 041 BR-26 preserves arbitrary remote http(s) images from spec 022. */
import Image from 'next/image'
import { useState } from 'react'
import { isMyStayStorageUrl } from '@/features/poi-photos/lib/storage-url'

const MYSTAY_IMAGE_FALLBACK = '/og-mystay.png'

type RemotePoiImageProps = {
  src: string
  alt: string
  width: number
  height: number
  loading: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  decoding?: 'sync' | 'async' | 'auto'
  className?: string
}

export function RemotePoiImage({
  src,
  alt,
  width,
  height,
  loading,
  fetchPriority,
  decoding = 'async',
  className,
}: RemotePoiImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const failed = failedSource === src
  const renderedSource = failed ? MYSTAY_IMAGE_FALLBACK : src

  // Spec 063 AC-03-03 : une copie MyStay passe par l'optimiseur next/image.
  if (!failed && isMyStayStorageUrl(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        className={className}
        onError={() => setFailedSource(src)}
      />
    )
  }

  return (
    <img
      src={renderedSource}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      referrerPolicy="no-referrer"
      className={className}
      onError={event => {
        if (event.currentTarget.getAttribute('src') !== MYSTAY_IMAGE_FALLBACK) {
          setFailedSource(src)
        }
      }}
    />
  )
}
