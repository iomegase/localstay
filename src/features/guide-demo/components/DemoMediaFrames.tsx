import { ImageIcon, Play } from 'lucide-react'

/**
 * Rangée de médias d'une carte du livret : photos réelles, cadres photo à
 * icône (photos non encore fournies) et cadre vidéo à icône sans vidéo réelle.
 */
export function DemoMediaFrames({
  photos = [],
  photoPlaceholders = [],
  videoPlaceholder,
  altPrefix,
}: {
  photos?: readonly string[]
  photoPlaceholders?: readonly string[]
  videoPlaceholder?: string
  altPrefix: string
}) {
  if (photos.length === 0 && photoPlaceholders.length === 0 && !videoPlaceholder) {
    return null
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {photos.map((photo, photoIndex) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${photo}-${photoIndex}`}
          src={photo}
          alt={`${altPrefix} ${photoIndex + 1}`}
          className="h-16 w-16 rounded-xl border border-white/15 object-cover"
        />
      ))}
      {photoPlaceholders.map(label => (
        <div
          key={label}
          data-testid="demo-arrival-photo-frame"
          role="img"
          aria-label={label}
          className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-white/25 bg-white/5 text-white/60"
        >
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      ))}
      {videoPlaceholder ? (
        <div
          data-testid="demo-arrival-video-frame"
          role="img"
          aria-label={videoPlaceholder}
          className="grid h-16 w-28 place-items-center rounded-xl border border-white/15 bg-slate-950"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white">
            <Play className="h-4 w-4 translate-x-px" aria-hidden="true" />
          </span>
        </div>
      ) : null}
    </div>
  )
}
