/**
 * Spec 019 AC-COR-02 — reprise : descriptions de randonnées coupées à 1 500 caractères par l'ancien
 * import Camptocamp → texte Camptocamp complet. Seulement si le texte actuel est encore le début du
 * texte complet (jamais d'écrasement d'une description modifiée par l'admin).
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env scripts/repair-truncated-trail-descriptions.ts [--apply]
 */
import { camptocampDescription } from '@/features/trails-acquisition/services/camptocamp'
import { prisma } from '@/shared/lib/prisma'

const squash = (value: string) => value.replace(/\s+/g, ' ').trim()

/** Le texte actuel, coupé par l'ancien import, est-il le début du texte complet ? */
function isUntouchedTruncation(current: string | null, full: string | null): full is string {
  if (!current || !full || full.length <= current.length || current.length < 1400 || current.length > 1500) return false
  return squash(full).startsWith(squash(current).slice(0, -20))
}

function frenchCamptocampText(rawPayload: unknown): string | null {
  const locales = (rawPayload as { locales?: Array<{ lang?: string; description?: string; summary?: string }> } | null)?.locales ?? []
  const locale = locales.find(item => item.lang === 'fr') ?? locales[0]
  return camptocampDescription(locale?.description ?? locale?.summary ?? null)
}

async function main() {
  const apply = process.argv.includes('--apply')
  const candidates = await prisma.trailCandidate.findMany({
    where: { deleted_at: null, primary_source_type: 'camptocamp', review_status: { in: ['needs_review', 'published'] } },
    select: { id: true, title: true, description: true, raw_payload: true, published_poi: { select: { id: true, description: true, deleted_at: true } } },
  })

  let fixes = 0
  for (const candidate of candidates) {
    const full = frenchCamptocampText(candidate.raw_payload)
    const fixCandidate = isUntouchedTruncation(candidate.description, full)
    const poi = candidate.published_poi && !candidate.published_poi.deleted_at ? candidate.published_poi : null
    const fixPoi = poi ? isUntouchedTruncation(poi.description, full) : false
    if (!fixCandidate && !fixPoi) continue
    fixes += 1
    console.log(`  + ${candidate.title} : ${candidate.description?.length ?? 0} → ${full!.length} caractères${fixPoi ? ' (fiche publiée comprise)' : ''}`)
    if (!apply) continue
    if (fixCandidate) await prisma.trailCandidate.update({ where: { id: candidate.id }, data: { description: full } })
    if (fixPoi) await prisma.pointOfInterest.update({ where: { id: poi!.id }, data: { description: full } })
  }
  console.log(`${fixes} description(s) à compléter.`)
  console.log(apply ? 'Appliqué.' : 'Dry-run : rien n’est écrit. Relancer avec --apply.')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
