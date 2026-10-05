/** Spec 043 AC-06-01/02/03 : décisions factuelles du PO, 2026-10-05. */
import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')

async function main() {
  await prisma.$transaction(async tx => {
    for (const correction of [
      { slug: 'la-pieuca', surface: 160, old: /\b170\s*m(?:²|2)(?![\p{L}\p{N}])/gu },
      { slug: 'la-ferme-des-places', surface: 180, old: /\b185\s*m(?:²|2)(?![\p{L}\p{N}])/gu },
    ]) {
      const profile = await tx.lodgingPublicProfile.findUniqueOrThrow({ where: { slug: correction.slug, deleted_at: null, publication_status: 'published' }, select: { id: true, surface_m2: true, short_description: true, description: true } })
      if (profile.surface_m2 !== correction.surface) throw new Error(`Surface structurée modifiée depuis validation : ${correction.slug}`)
      const data = {
        short_description: profile.short_description.replace(correction.old, `${correction.surface} m²`),
        description: profile.description.replace(correction.old, `${correction.surface} m²`),
      }
      console.log(JSON.stringify({ slug: correction.slug, surface_m2: correction.surface, changed: data.short_description !== profile.short_description || data.description !== profile.description, apply }))
      if (apply && (data.short_description !== profile.short_description || data.description !== profile.description)) {
        await tx.lodgingPublicProfile.update({ where: { id: profile.id, short_description: profile.short_description, description: profile.description }, data })
      }
    }
    const royal = await tx.pointOfInterest.findMany({ where: { slug: 'le-royal', deleted_at: null, city: { slug: 'saint-gervais-les-bains' } }, select: { id: true, description: true } })
    if (royal.length !== 1) throw new Error('Fiche Le Royal absente ou ambiguë.')
    const poi = royal[0]
    const description = poi.description?.replace(' Le restaurant est ouvert du mardi au dimanche midi.', '') ?? null
    console.log(JSON.stringify({ slug: 'le-royal', descriptionChanged: description !== poi.description, hours: 'conservés depuis Google Places (2026-09-29)', apply }))
    if (apply && description !== poi.description) await tx.pointOfInterest.update({ where: { id: poi.id, description: poi.description }, data: { description } })
  }, { timeout: 30000 })
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Correction impossible'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
