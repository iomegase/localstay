'use client'

interface Props {
  photos: string[]
  name: string
}

export function PhotoCarousel({ photos, name }: Props) {
  if (photos.length === 0) {
    return <div className="h-40 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl mx-4" />
  }

  return (
    <div
      className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory"
      style={{ scrollbarWidth: 'none' }}
      data-testid="photo-carousel"
    >
      {photos.map((url, i) => (
        <div
          key={i}
          className="shrink-0 w-64 h-44 rounded-2xl overflow-hidden snap-center shadow-sm"
        >
          <img
            src={url}
            alt={`${name} — photo ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
