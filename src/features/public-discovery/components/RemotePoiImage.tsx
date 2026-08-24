'use client'

/* eslint-disable @next/next/no-img-element -- Spec 041 BR-26 preserves arbitrary remote http(s) images from spec 022. */
import { useState } from 'react'

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
  const renderedSource = failedSource === src ? MYSTAY_IMAGE_FALLBACK : src

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
