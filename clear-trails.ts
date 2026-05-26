import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const audit = await prisma.trailAuditLog.deleteMany()
  const candidates = await prisma.trailCandidate.deleteMany()
  const runs = await prisma.trailImportRun.deleteMany()
  const details = await prisma.trailDetail.deleteMany()
  console.log(`✅ Runs: ${runs.count} · Candidats: ${candidates.count} · Détails: ${details.count} · Audit: ${audit.count}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
