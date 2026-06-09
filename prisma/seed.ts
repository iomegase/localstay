import { PrismaClient } from '@prisma/client'
import { seedRecommendedTaxonomy } from '../src/features/admin-taxonomy/lib/recommended-taxonomy'

const prisma = new PrismaClient()

async function main() {
  // Spec 001 / 002 / 017: seed only stable reference data.
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;')

  await prisma.city.upsert({
    where: { slug: 'saint-gervais-les-bains' },
    update: {
      name: 'Saint-Gervais-les-Bains',
      postal_code: '74170',
      department: 'Haute-Savoie',
      region: 'Auvergne-Rhône-Alpes',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
      deleted_at: null,
    },
    create: {
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      postal_code: '74170',
      department: 'Haute-Savoie',
      region: 'Auvergne-Rhône-Alpes',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
    },
  })

  // Spec 026 — seed insee_code for DATAtourisme event ingestion
  const CITIES_INSEE: Array<{ slug: string; name: string; postal_code: string; insee_code: string; latitude: number; longitude: number }> = [
    { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', postal_code: '74170', insee_code: '74236', latitude: 45.8923, longitude: 6.7123 },
    { slug: 'chamonix-mont-blanc', name: 'Chamonix-Mont-Blanc', postal_code: '74400', insee_code: '74056', latitude: 45.9237, longitude: 6.8694 },
    { slug: 'les-contamines-montjoie', name: 'Les Contamines-Montjoie', postal_code: '74170', insee_code: '74085', latitude: 45.8217, longitude: 6.7281 },
  ]

  for (const c of CITIES_INSEE) {
    await prisma.city.upsert({
      where: { slug: c.slug },
      update: { insee_code: c.insee_code },
      create: {
        name: c.name, slug: c.slug, postal_code: c.postal_code,
        department: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes',
        latitude: c.latitude, longitude: c.longitude, insee_code: c.insee_code,
      },
    })
  }

  await seedRecommendedTaxonomy(prisma)

  console.log('Seed complete: pilot city + recommended taxonomy only.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
