import type { DuplicateCandidateInput, DuplicatePoi } from '../types'

const STOP_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'un', 'une', 'au', 'aux'])
const CLOSE_DISTANCE_KM = 0.15

export function normalizePoiIdentity(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 0 && !STOP_WORDS.has(token))
    .join(' ')
}

export function findProbableDuplicates(
  candidate: DuplicateCandidateInput,
  existingPois: DuplicatePoi[],
): DuplicatePoi[] {
  const candidateName = normalizePoiIdentity(candidate.name)
  const candidateAddress = normalizePoiIdentity(candidate.address)

  return existingPois.filter(poi => {
    if (candidate.google_place_id && poi.google_place_id === candidate.google_place_id) return true

    const sameName = normalizePoiIdentity(poi.name) === candidateName
    const existingAddress = normalizePoiIdentity(poi.address)
    if (sameName && addressLooksRelated(candidateAddress, existingAddress)) return true

    if (sameName && hasCloseCoordinates(candidate, poi)) return true

    return false
  })
}

function addressLooksRelated(left: string, right: string): boolean {
  if (left === right) return true
  const leftTokens = new Set(left.split(' ').filter(Boolean))
  const rightTokens = right.split(' ').filter(Boolean)
  const common = rightTokens.filter(token => leftTokens.has(token)).length
  return common >= Math.min(3, rightTokens.length)
}

function hasCloseCoordinates(candidate: DuplicateCandidateInput, poi: DuplicatePoi): boolean {
  if (
    typeof candidate.latitude !== 'number' ||
    typeof candidate.longitude !== 'number' ||
    typeof poi.latitude !== 'number' ||
    typeof poi.longitude !== 'number'
  ) {
    return false
  }

  return haversineKm(candidate.latitude, candidate.longitude, poi.latitude, poi.longitude) <= CLOSE_DISTANCE_KM
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radiusKm = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
