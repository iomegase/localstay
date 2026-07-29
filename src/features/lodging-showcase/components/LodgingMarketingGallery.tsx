import Image from 'next/image'

type GalleryPhoto = {
  id: string
  url: string
  alt: string
}

export function LodgingMarketingGallery({
  title,
  photos,
}: {
  title: string
  photos: GalleryPhoto[]
}) {
  const visiblePhotos = photos.slice(0, 3)

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

  return (
    <section
      aria-label={`Photos de ${title}`}
      data-testid="lodging-marketing-gallery"
      className="mx-auto grid h-[440px] w-full max-w-[944px] grid-cols-2 grid-rows-[2fr_1fr] gap-1.5 overflow-hidden md:h-[520px] md:grid-cols-[1.7fr_0.85fr] md:grid-rows-2 md:gap-3 md:rounded-[26px] xl:h-[560px]"
    >
      <div className="relative col-span-2 overflow-hidden md:col-span-1 md:row-span-2">
        <Image
          src={mainPhoto.url}
          alt={mainPhoto.alt}
          fill
          priority
          unoptimized
          sizes="(min-width: 1280px) 630px, (min-width: 768px) 66vw, 100vw"
          className="object-cover"
        />
      </div>

      {secondaryPhotos.map((photo) => (
        <div
          key={photo.id}
          className="relative overflow-hidden bg-slate-100"
        >
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            unoptimized
            sizes="(min-width: 768px) 32vw, 50vw"
            className="object-cover"
          />
        </div>
      ))}

      {secondaryPhotos.length === 0 && (
        <div className="relative overflow-hidden bg-slate-100">
          <Image
            src={mainPhoto.url}
            alt=""
            fill
            unoptimized
            sizes="50vw"
            className="object-cover"
          />
        </div>
      )}
    </section>
  )
}
