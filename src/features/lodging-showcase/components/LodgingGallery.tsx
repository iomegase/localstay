export function LodgingGallery(props: {
  title: string
  photos: Array<{
    id: string
    url: string
    alt: string
    room_type: string | null
    sort_order: number
    is_cover: boolean
  }>
}) {
  if (props.photos.length === 0) {
    return <div className="aspect-[4/3] rounded-3xl bg-stone-100" aria-hidden="true" />
  }

  const [cover, ...rest] = props.photos

  return (
    <section aria-label={`Photos de ${props.title}`} className="grid gap-3 md:grid-cols-[2fr_1fr]">
      <div className="overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover.url} alt={cover.alt} className="aspect-[4/3] w-full object-cover" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
        {rest.slice(0, 4).map(photo => (
          <div key={photo.id} className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}
