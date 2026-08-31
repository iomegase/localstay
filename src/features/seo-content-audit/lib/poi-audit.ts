import { auditTextQuality, compareAuditDescriptions } from './text-audit'
import type { PublicPoiAuditRow } from '../queries/audit-data'
import type { SeoContentAuditFinding } from '../types'

function publicContext(row: PublicPoiAuditRow): string[] {
  return [
    `POI : ${row.name}`,
    `City : ${row.cityName}`,
    `Catégorie : ${row.categoryName}`,
  ]
}

function finding(
  row: PublicPoiAuditRow,
  code: SeoContentAuditFinding['code'],
  evidence: string[],
): SeoContentAuditFinding {
  return {
    publicUrl: row.publicUrl,
    entityType: 'poi',
    entityId: row.id,
    code,
    evidence: [...publicContext(row), ...evidence],
    updatedAt: row.updatedAt,
    requiresOwnerDecision: true,
  }
}

function safeWebsiteHost(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname || null
  } catch {
    return null
  }
}

function provenanceEvidence(row: PublicPoiAuditRow): string[] | null {
  const relevant = [...new Map(
    row.provenance
      .filter((source) => (
        source.candidateDescriptionPresent
        || source.website !== null
        || !['', 'manual'].includes(source.source.trim().toLowerCase())
        || !['', 'manual'].includes(source.runSource.trim().toLowerCase())
      ))
      .map(source => [
        JSON.stringify([
          source.source,
          source.runSource,
          source.website,
          source.candidateDescriptionPresent,
        ]),
        source,
      ]),
  ).values()]
  if (relevant.length === 0) return null

  return relevant.flatMap((source) => {
    const evidence = [
      `Provenance déclarée à vérifier : ${source.source || 'non précisée'} (run : ${source.runSource || 'non précisé'}).`,
    ]
    const websiteHost = safeWebsiteHost(source.website)
    if (websiteHost) evidence.push(`Site source déclaré : ${websiteHost}.`)
    if (source.candidateDescriptionPresent) {
      evidence.push('Un texte source présent dans les données d’acquisition requiert une revue humaine.')
    }
    return evidence
  })
}

export function auditPublicPois(rows: PublicPoiAuditRow[]): SeoContentAuditFinding[] {
  const sortedRows = [...rows].sort((left, right) =>
    left.publicUrl.localeCompare(right.publicUrl, 'fr'),
  )
  const findings: SeoContentAuditFinding[] = []

  for (const row of sortedRows) {
    for (const quality of auditTextQuality(row.description ?? '')) {
      findings.push(finding(row, quality.code, [quality.evidence]))
    }

    const evidence = provenanceEvidence(row)
    if (evidence) {
      findings.push(finding(row, 'EXTERNAL_SOURCE_REVIEW_REQUIRED', evidence))
    }
  }

  for (let leftIndex = 0; leftIndex < sortedRows.length; leftIndex += 1) {
    const left = sortedRows[leftIndex]
    for (let rightIndex = leftIndex + 1; rightIndex < sortedRows.length; rightIndex += 1) {
      const right = sortedRows[rightIndex]
      const comparison = compareAuditDescriptions(
        left.description ?? '',
        right.description ?? '',
      )
      if (!comparison) continue

      const pairEvidence = [
        comparison.evidence,
        `Paire comparée : ${left.publicUrl} ↔ ${right.publicUrl}.`,
      ]
      findings.push(finding(left, comparison.code, pairEvidence))
      findings.push(finding(right, comparison.code, pairEvidence))
    }
  }

  return findings.sort((left, right) => (
    left.code.localeCompare(right.code, 'fr')
    || left.publicUrl.localeCompare(right.publicUrl, 'fr')
    || (left.entityId ?? '').localeCompare(right.entityId ?? '', 'fr')
  ))
}
