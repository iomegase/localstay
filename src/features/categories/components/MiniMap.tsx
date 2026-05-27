interface Props {
  latitude: number
  longitude: number
  poiName: string
  width?: number
  height?: number
  zoom?: number
}

export function MiniMap({ latitude, longitude, poiName, width = 600, height = 360, zoom = 16 }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
  const marker = `pin-s+ff4444(${longitude},${latitude})`
  const center = `${longitude},${latitude},${zoom}`
  const size = `${width}x${height}`
  const src = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${marker}/${center}/${size}?access_token=${token}`

  return (
    <img
      src={src}
      alt={`Carte — ${poiName}`}
      width={width}
      height={height}
      className="w-full rounded-2xl object-cover"
      data-testid="mini-map"
      loading="lazy"
    />
  )
}
