import type {
  GuideMode,
  GuideTrailSummary,
} from '@/features/guide-app/types'

export function canStartTrail(
  mode: GuideMode,
  trail: GuideTrailSummary | undefined,
) {
  return mode === 'private' && trail?.trackingEnabled === true
}
