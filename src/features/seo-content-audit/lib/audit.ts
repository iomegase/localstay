import path from 'node:path'
import {
  getPublicLodgingAuditRows,
  getPublicPoiAuditRows,
} from '../queries/audit-data'
import type { SeoContentAuditFinding } from '../types'
import { auditPublicLodgings } from './lodging-audit'
import { auditPublicPois } from './poi-audit'

export type SeoContentAuditResult = {
  generatedAt: string
  auditedPoiCount: number
  auditedLodgingCount: number
  findings: SeoContentAuditFinding[]
}

export type SeoContentAuditOptions = {
  now?: () => Date
}

function compareFindings(left: SeoContentAuditFinding, right: SeoContentAuditFinding): number {
  return (
    left.code.localeCompare(right.code, 'fr')
    || left.publicUrl.localeCompare(right.publicUrl, 'fr')
    || (left.entityId ?? '').localeCompare(right.entityId ?? '', 'fr')
    || left.evidence.join(' ').localeCompare(right.evidence.join(' '), 'fr')
  )
}

export async function runSeoContentAudit(
  options: SeoContentAuditOptions = {},
): Promise<SeoContentAuditResult> {
  const [pois, lodgings] = await Promise.all([
    getPublicPoiAuditRows(),
    getPublicLodgingAuditRows(),
  ])
  const findings = [
    ...auditPublicPois(pois),
    ...auditPublicLodgings(lodgings),
  ].sort(compareFindings)

  return {
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    auditedPoiCount: pois.length,
    auditedLodgingCount: lodgings.length,
    findings,
  }
}

export function resolveAuditOutputPath(output: string, cwd = process.cwd()): string {
  const auditDirectory = path.resolve(cwd, 'docs/audits')
  const target = path.resolve(cwd, output)
  const relative = path.relative(auditDirectory, target)

  if (
    !relative
    || relative.startsWith(`..${path.sep}`)
    || relative === '..'
    || path.isAbsolute(relative)
  ) {
    throw new Error('Le rapport doit être un fichier situé sous docs/audits/.')
  }
  return target
}
