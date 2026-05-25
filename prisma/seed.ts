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
