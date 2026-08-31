import type { SeoContentAuditFinding } from '../types'

export type SeoContentAuditReportInput = {
  generatedAt: string
  auditedPoiCount: number
  auditedLodgingCount: number
  findings: SeoContentAuditFinding[]
}

const MAX_EVIDENCE_LENGTH = 180
const PRIVATE_DATA_PATTERNS: RegExp[] = [
  /(?:[?&]|\b)lodging\s*=/iu,
  /stay[_-]?lodging[_-]?id\s*=/iu,
  /(?:stay|lodging)[^\n]{0,30}cookie|cookie[^\n]{0,30}(?:stay|lodging)/iu,
  /\btoken\s*=/iu,
  /\bpassword\b/iu,
  /mot\s+de\s+passe/iu,
  /code\s+d['’]?acc[eè]s/iu,
  /\blodging_id\b/iu,
  /\b(?:owner|merchant|tourist)_email\b/iu,
]

function assertPrivacySafe(findings: SeoContentAuditFinding[]): void {
  for (const finding of findings) {
    const values = [finding.publicUrl, ...finding.evidence]
    if (values.some(value => PRIVATE_DATA_PATTERNS.some(pattern => pattern.test(value)))) {
      throw new Error('Donnée privée ou secrète détectée dans le rapport SEO.')
    }
  }
}

function escapeTableCell(value: string): string {
  const compact = value.replace(/\r?\n/gu, '<br>').slice(0, MAX_EVIDENCE_LENGTH)
  return compact.replace(/\|/gu, '\\|')
}

function compareFindings(left: SeoContentAuditFinding, right: SeoContentAuditFinding): number {
  return (
    left.code.localeCompare(right.code, 'fr')
    || left.publicUrl.localeCompare(right.publicUrl, 'fr')
    || (left.entityId ?? '').localeCompare(right.entityId ?? '', 'fr')
  )
}

function renderFindingTable(findings: SeoContentAuditFinding[]): string {
  if (findings.length === 0) return 'Aucune.'

  const rows = findings.map(finding => [
    escapeTableCell(finding.code),
    escapeTableCell(finding.publicUrl),
    escapeTableCell(finding.entityId ?? '—'),
    escapeTableCell(finding.updatedAt ?? '—'),
    finding.evidence.map(escapeTableCell).join('<br>'),
  ].join(' | '))

  return [
    '| Code | URL publique | Identifiant public | Mise à jour | Preuves courtes |',
    '|---|---|---|---|---|',
    ...rows.map(row => `| ${row} |`),
  ].join('\n')
}

function renderFindingCounts(findings: SeoContentAuditFinding[]): string {
  const counts = new Map<string, number>()
  for (const finding of findings) {
    counts.set(finding.code, (counts.get(finding.code) ?? 0) + 1)
  }
  if (counts.size === 0) return '- Aucun constat automatique.'
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'fr'))
    .map(([code, count]) => `- \`${code}\` : **${count}**`)
    .join('\n')
}

function renderDecisions(findings: SeoContentAuditFinding[]): string {
  const decisions = findings.filter(finding => finding.requiresOwnerDecision)
  if (decisions.length === 0) return 'Aucune.'
  return [
    'Aucune valeur n’est corrigée automatiquement. Chaque point ci-dessous demande une validation humaine :',
    '',
    ...decisions.map(finding => (
      `- \`${finding.code}\` — ${escapeTableCell(finding.publicUrl)} — ${escapeTableCell(finding.evidence[0] ?? 'preuve à relire')}`
    )),
  ].join('\n')
}

export function renderSeoContentAuditReport(input: SeoContentAuditReportInput): string {
  assertPrivacySafe(input.findings)
  const findings = [...input.findings].sort(compareFindings)
  const poiFindings = findings.filter(finding => finding.entityType === 'poi')
  const lodgingFindings = findings.filter(finding => finding.entityType === 'lodging')

  return `# Audit qualité SEO / GEO des contenus publics

Généré le ${input.generatedAt}.

## Résumé

- POI publics audités : **${input.auditedPoiCount}**
- Logements publics audités : **${input.auditedLodgingCount}**
- Constats détaillés : **${findings.length}**

${renderFindingCounts(findings)}

Les fiches sans constat contribuent aux totaux audités mais ne sont pas détaillées.

## Méthode reproductible

- Contenu trop court : moins de **80 caractères**.
- Similarité interne : descriptions normalisées d’au moins **120 caractères**.
- Normalisation Unicode **NFKD**, suppression des diacritiques et de la ponctuation, casse et espaces uniformisés.
- Mesure : Jaccard des **trigrammes de mots**, seuil **0.85**.
- La similarité est un **indicateur de similarité** destiné à la revue humaine, jamais une conclusion de copie.
- Les champs structurés restent la source de vérité ; une absence de mention textuelle n’est pas une contradiction.
- Audit en lecture seule, sans scraping, réécriture, publication ou dépublication automatique.

## Résultats POI

${renderFindingTable(poiFindings)}

## Contradictions logements

${renderFindingTable(lodgingFindings)}

## Structure éditoriale recommandée

Cette **proposition documentaire** distingue :

- description factuelle ;
- conseil MyStay ;
- informations pratiques ;
- source externe éventuelle ;
- date de mise à jour.

Elle n’autorise **aucune migration Prisma** ni publication automatique sans nouvelle validation de spec.

## Décisions Product Owner requises

${renderDecisions(findings)}
`
}
