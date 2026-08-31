import { prisma } from '@/shared/lib/prisma'
import {
  createPrismaLodgingSlugReader,
  runLodgingSlugAudit,
} from './audit-lodging-slugs-runner'

void runLodgingSlugAudit({
  readProfiles: createPrismaLodgingSlugReader(prisma),
  disconnect: () => prisma.$disconnect(),
  writeLine: (line) => console.log(line),
}).then((exitCode) => {
  process.exitCode = exitCode
}).catch(() => {
  console.error('Lodging slug audit failed.')
  process.exitCode = 1
})
