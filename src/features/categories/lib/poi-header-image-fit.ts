export type PoiHeaderImageFit = 'object-cover' | 'object-contain'

type ImageDimensions = {
  width: number
  height: number
}

export function getPoiHeaderImageFit({ width, height }: ImageDimensions): PoiHeaderImageFit {
  if (width <= 0 || height <= 0) return 'object-cover'

  return width > height ? 'object-contain' : 'object-cover'
}
