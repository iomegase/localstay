import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  resolveAuditOutputPath,
  runSeoContentAudit,
} from '@/features/seo-content-audit/lib/audit'
import { renderSeoContentAuditReport } from '@/features/seo-content-audit/lib/report'
import { prisma } from '@/shared/lib/prisma'

function argumentValue(name: '--date' | '--output'): string | null {
  const equalsPrefix = `${name}=`
  const equalsArgument = process.argv.find(value => value.startsWith(equalsPrefix))
  if (equalsArgument) return equalsArgument.slice(equalsPrefix.length)

  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

function auditDate(): string {
  const value = argumentValue('--date') ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error('La date doit utiliser le format YYYY-MM-DD.')
  }
  return value
}

async function main(): Promise<void> {
  const date = auditDate()
  const relativeOutput = argumentValue('--output')
    ?? `docs/audits/seo-content-quality-${date}.md`
  const outputPath = resolveAuditOutputPath(relativeOutput)
  const result = await runSeoContentAudit()
  const report = renderSeoContentAuditReport(result)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, report, 'utf8')

  console.log(`Audited public POIs: ${result.auditedPoiCount}`)
  console.log(`Audited public lodgings: ${result.auditedLodgingCount}`)
  console.log(`Findings: ${result.findings.length}`)
  console.log(`Report written: ${path.relative(process.cwd(), outputPath)}`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Échec de l’audit SEO.')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
