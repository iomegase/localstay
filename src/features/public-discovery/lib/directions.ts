type DiscoveryDirectionsInput = {
  address: string | null
  latitude: number
  longitude: number
}

export function buildDiscoveryDirectionsHref(input: DiscoveryDirectionsInput): string {
  const destination = input.address?.trim() || `${input.latitude},${input.longitude}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}
