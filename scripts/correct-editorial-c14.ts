/** Spec 042 AC-09-03/04 : corrections publiques ciblées, aucun fait arbitré. */
import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { normalizeEditorialWhitespace, normalizeGeographicLabel } from '../src/shared/lib/editorial-label'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')
const renameSlugs = process.argv.includes('--rename-slugs')
const renames = [
  { kind: 'lodging', from: 'appart-luxe-vue-mont-blanc-6-p', to: 'appartement-vue-mont-blanc-6-p', prefix: '/logements/' },
  { kind: 'article', from: 'article-f7e6dcbc', to: 'restaurants-altitude-saint-nicolas-de-veroce', prefix: '/journal/' },
] as const

async function main() {
  if (renameSlugs && apply) {
    // Le code de redirection doit être réellement en ligne avant la mutation.
    for (const item of renames) {
      const response = await fetch(`https://www.mystay.city${item.prefix}${item.from}`, { redirect: 'manual' })
      const location = response.headers.get('location')
      if (response.status !== 308 || !location || new URL(location, 'https://www.mystay.city').pathname !== `${item.prefix}${item.to}`) {
        throw new Error(`Redirection 308 non déployée : ${item.prefix}${item.from}`)
      }
    }
  }
  await prisma.$transaction(async tx => {
    const cities = await tx.city.findMany({ where: { deleted_at: null, is_active: true }, select: { id: true, name: true, department: true, region: true } })
    for (const city of cities) {
      const data = { name: normalizeGeographicLabel(city.name), department: city.department === null ? null : normalizeGeographicLabel(city.department), region: city.region === null ? null : normalizeGeographicLabel(city.region) }
      if (data.name === city.name && data.department === city.department && data.region === city.region) continue
      console.log(JSON.stringify({ city: city.name, before: { name: city.name, department: city.department, region: city.region }, after: data }))
      if (apply) await tx.city.update({ where: { id: city.id }, data })
    }
    const lodgings = await tx.lodgingPublicProfile.findMany({ where: { deleted_at: null, publication_status: 'published', city: { deleted_at: null, is_active: true }, lodging: { deleted_at: null, is_active: true } }, select: { id: true, slug: true, title: true, public_area_label: true } })
    for (const lodging of lodgings) {
      const data = { title: normalizeEditorialWhitespace(lodging.title), public_area_label: lodging.public_area_label === null ? null : normalizeGeographicLabel(lodging.public_area_label) }
      if (data.title === lodging.title && data.public_area_label === lodging.public_area_label) continue
      console.log(JSON.stringify({ lodging: lodging.slug, before: { title: lodging.title, public_area_label: lodging.public_area_label }, after: data }))
      if (apply) await tx.lodgingPublicProfile.update({ where: { id: lodging.id }, data })
    }
    if (renameSlugs) for (const item of renames) {
      // Appels séparés pour conserver le typage Prisma strict.
      const existing = item.kind === 'lodging'
        ? await tx.lodgingPublicProfile.findUnique({ where: { slug: item.to }, select: { id: true } })
        : await tx.blogArticle.findUnique({ where: { slug: item.to }, select: { id: true } })
      if (existing) throw new Error(`Slug destination déjà utilisé : ${item.to}`)
      console.log(JSON.stringify({ rename: item.from, to: item.to, apply }))
      if (!apply) continue
      if (item.kind === 'lodging') await tx.lodgingPublicProfile.update({ where: { slug: item.from, deleted_at: null, publication_status: 'published' }, data: { slug: item.to } })
      else await tx.blogArticle.update({ where: { slug: item.from, deleted_at: null, status: 'published' }, data: { slug: item.to } })
    }
  }, { timeout: 30000 })
  console.log(apply ? 'Corrections appliquées.' : 'Simulation uniquement ; utiliser --apply pour enregistrer.')
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Correction impossible'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
