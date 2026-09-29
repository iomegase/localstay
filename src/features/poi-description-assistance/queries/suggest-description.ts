import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { DescriptionAssistanceError } from '../lib/contracts'
import { generatePoiDescription } from '../services/generate-description'

export async function suggestPoiDescription(id: string) {
  if (!z.string().uuid().safeParse(id).success) throw new DescriptionAssistanceError('INVALID_INPUT')
  const poi = await prisma.pointOfInterest.findUnique({
    where: { id },
    select: { name: true, address: true, website: true, deleted_at: true, city: { select: { name: true } } },
  })
  if (!poi) throw new DescriptionAssistanceError('POI_NOT_FOUND')
  if (poi.deleted_at) throw new DescriptionAssistanceError('POI_ARCHIVED')
  return generatePoiDescription({ name: poi.name, address: poi.address, website: poi.website, city: poi.city.name })
}
