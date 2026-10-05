/**
 * Spec 012 BR-26 — conversion unique des photos de logement AVIF déjà stockées en WebP
 * (l'optimiseur Vercel ne redimensionne pas les AVIF). L'ancien fichier reste dans le bucket.
 * Usage : npx tsx --env-file=.env.local scripts/convert-avif-photos-to-webp.ts [--apply]
 */
import { convertStoredAvifPhotos } from '@/shared/lib/avif-to-webp-backfill'
import { prisma } from '@/shared/lib/prisma'
import { createSupabaseServer } from '@/shared/lib/supabase'

const BUCKET = 'guide-photos'

async function main() {
  const apply = process.argv.includes('--apply')
  const storage = createSupabaseServer().storage.from(BUCKET)
  const rows = await prisma.lodgingPhoto.findMany({
    where: { deleted_at: null, url: { endsWith: '.avif' } },
    select: { id: true, url: true },
  })
  console.log(`${rows.length} photos AVIF actives${apply ? '' : ' (simulation, ajouter --apply)'}`)

  const report = await convertStoredAvifPhotos(
    rows,
    {
      download: async path => {
        const { data, error } = await storage.download(path)
        if (error || !data) throw new Error(`téléchargement ${path} : ${error?.message ?? 'vide'}`)
        return Buffer.from(await data.arrayBuffer())
      },
      upload: async (path, body) => {
        const { error } = await storage.upload(path, body, { contentType: 'image/webp', upsert: true })
        if (error) throw new Error(`envoi ${path} : ${error.message}`)
      },
      publicUrl: path => storage.getPublicUrl(path).data.publicUrl,
      updateUrl: async (id, url) => {
        await prisma.lodgingPhoto.update({ where: { id }, data: { url } })
      },
    },
    { apply },
  )
  console.log(`Converties : ${report.converted}, ignorées : ${report.skipped}, en échec : ${report.failed}`)
  await prisma.$disconnect()
}

main().catch(async error => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
