/**
 * Spec 101 AC-01-04 — reprise : POI actifs à la position approximative (« à vérifier » : code postal
 * ou commune) → nom cherché dans OpenStreetMap à 30 km du centre de leur ville.
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env scripts/regeocode-approximate-pois.ts [--apply]
 */
import { findOsmPlaceByName } from '@/features/geocoding/services/osm-name-geocoder'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const pois = await prisma.pointOfInterest.findMany({
    where: { deleted_at: null, is_active: true, geocode_status: 'pending_review' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, latitude: true, longitude: true, city: { select: { name: true, latitude: true, longitude: true } } },
  })
  console.log(`${pois.length} POI actifs à la position « à vérifier ».`)

  let found = 0
  for (const poi of pois) {
    const place = await findOsmPlaceByName(poi.name, poi.city)
    if (!place) {
      console.log(`  · ${poi.name} (${poi.city.name}) : introuvable dans OpenStreetMap`)
      continue
    }
    found += 1
    console.log(`  + ${poi.name} (${poi.city.name}) : ${poi.latitude}, ${poi.longitude} → ${place.latitude}, ${place.longitude} (OSM ${place.osm_type} ${place.osm_id})`)
    if (apply) {
      await prisma.pointOfInterest.update({
        where: { id: poi.id },
        data: {
          latitude: place.latitude,
          longitude: place.longitude,
          geocode_status: 'success',
          geocode_provider: 'openstreetmap',
          geocode_error: null,
          geocoded_at: new Date(),
          geocode_attempts: { increment: 1 },
        },
      })
    }
  }
  console.log(`${found} POI repositionnés par OpenStreetMap.`)
  console.log(apply ? 'Appliqué.' : 'Dry-run : rien n’est écrit. Relancer avec --apply.')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
