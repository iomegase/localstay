interface Props {
  latitude: number
  longitude: number
  poiName: string
  width?: number
  height?: number
  zoom?: number
}

export function MiniMap({ latitude, longitude, poiName, width = 600, height = 360, zoom = 17 }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
  const marker = `pin-s+ef4444(${longitude},${latitude})`
  const center = `${longitude},${latitude},${zoom}`
  const size = `${width}x${height}`
  const src = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${marker}/${center}/${size}?access_token=${token}`

  return (
    <img
      src={src}
      alt={`Carte — ${poiName}`}
      width={width}
      height={height}
      className="w-full  object-cover"
      data-testid="mini-map"
      loading="lazy"
    />
  )
}
