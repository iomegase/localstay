import type { SeoContentAuditFinding } from '@/features/seo-content-audit/types'

export const CONTENT_TOO_THIN_THRESHOLD = 80
export const SIMILARITY_MINIMUM_LENGTH = 120
export const HIGH_SIMILARITY_THRESHOLD = 0.85

type TextQualityCode = Extract<
  SeoContentAuditFinding['code'],
  'CONTENT_TOO_THIN' | 'PLACEHOLDER_CONTENT'
>

export type TextQualityFinding = {
  code: TextQualityCode
  evidence: string
}

export type AuditTextComparison = {
  code: Extract<
    SeoContentAuditFinding['code'],
    'EXACT_INTERNAL_DUPLICATE' | 'HIGH_INTERNAL_SIMILARITY'
  >
  score: number
  evidence: string
}

export function normalizeAuditText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function isManifestPlaceholder(value: string): boolean {
  const trimmed = value.trim()
  if (/^[.…]+$/u.test(trimmed)) return true

  const normalized = normalizeAuditText(value)
  return (
    normalized.includes('lorem ipsum') ||
    /(^| )todo( |$)/u.test(normalized) ||
    /(^| )tbd( |$)/u.test(normalized) ||
    /(^| )placeholder( |$)/u.test(normalized) ||
    normalized.includes('description des principes')
  )
}

export function auditTextQuality(value: string): TextQualityFinding[] {
  const findings: TextQualityFinding[] = []
  if (value.trim().length < CONTENT_TOO_THIN_THRESHOLD) {
    findings.push({
      code: 'CONTENT_TOO_THIN',
      evidence: `Description inférieure à ${CONTENT_TOO_THIN_THRESHOLD} caractères.`,
    })
  }
  if (isManifestPlaceholder(value)) {
    findings.push({
      code: 'PLACEHOLDER_CONTENT',
      evidence: 'Marqueur éditorial provisoire manifeste détecté.',
    })
  }
  return findings
}

function wordTrigrams(value: string): Set<string> {
  const words = normalizeAuditText(value).split(' ').filter(Boolean)
  const trigrams = new Set<string>()
  for (let index = 0; index <= words.length - 3; index += 1) {
    trigrams.add(words.slice(index, index + 3).join(' '))
  }
  return trigrams
}

export function wordTrigramJaccard(left: string, right: string): number {
  const leftTrigrams = wordTrigrams(left)
  const rightTrigrams = wordTrigrams(right)
  const union = new Set([...leftTrigrams, ...rightTrigrams])
  if (union.size === 0) return 0

  let intersectionSize = 0
  for (const trigram of leftTrigrams) {
    if (rightTrigrams.has(trigram)) intersectionSize += 1
  }
  return intersectionSize / union.size
}

export function compareAuditDescriptions(
  left: string,
  right: string,
): AuditTextComparison | null {
  const normalizedLeft = normalizeAuditText(left)
  const normalizedRight = normalizeAuditText(right)

  if (normalizedLeft && normalizedLeft === normalizedRight) {
    return {
      code: 'EXACT_INTERNAL_DUPLICATE',
      score: 1,
      evidence: 'Descriptions identiques après normalisation déterministe.',
    }
  }

  if (
    normalizedLeft.length < SIMILARITY_MINIMUM_LENGTH ||
    normalizedRight.length < SIMILARITY_MINIMUM_LENGTH
  ) {
    return null
  }

  const score = wordTrigramJaccard(normalizedLeft, normalizedRight)
  if (score < HIGH_SIMILARITY_THRESHOLD) return null

  return {
    code: 'HIGH_INTERNAL_SIMILARITY',
    score,
    evidence: `indicateur de similarité Jaccard des trigrammes de mots : ${score.toFixed(4)}.`,
  }
}
