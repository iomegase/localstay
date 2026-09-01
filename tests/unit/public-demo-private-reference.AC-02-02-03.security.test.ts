import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { demoGuideData } from '@/features/guide-demo/demo-content'

const GUIDE_DEMO_ROOT = join(process.cwd(), 'src/features/guide-demo')

const AUTONOMOUS_DATA_MODULES = new Set([
  'demo-content.ts',
  'demo-guide-data.ts',
  'demo-media-policy.ts',
  'demo-poi-content.ts',
  'demo-pois.ts',
  'demo-trail-geometry.ts',
  'types.ts',
])

function readTypeScriptFiles(directory: string): Array<{
  path: string
  source: string
}> {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return readTypeScriptFiles(path)
    }

    const modulePath = relative(GUIDE_DEMO_ROOT, path)
    if (!/\.tsx?$/.test(entry.name) || !AUTONOMOUS_DATA_MODULES.has(modulePath)) {
      return []
    }

    return [{ path: modulePath, source: readFileSync(path, 'utf8') }]
  })
}

describe('public demo private-guide isolation', () => {
  it('exposes complete deterministic demo fixtures', () => {
    expect(demoGuideData.lodging.id).toMatch(/^demo-/)
    expect(demoGuideData.favoritePois.length).toBeGreaterThan(0)
    expect(demoGuideData.lodgingCards.length).toBeGreaterThan(0)
    expect(demoGuideData.blogPosts.length).toBeGreaterThan(0)
    expect(demoGuideData.contact.lodgingName).toBe(
      'Le 305 — démonstration',
    )
  })

  it('contains no real identifiers or sensitive lodging-access details', () => {
    const serialized = JSON.stringify(demoGuideData)
    const uuidV1ToV5 =
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
    const accessSecret =
      /(?:digicode|code d['’]acc[eè]s|bo[iî]te [àa] cl[ée]s?|serrure (?:connect[ée]e?|num[ée]rique)|mot de passe)\s*(?:n[°o]\s*)?(?::|=|est)\s*["']?[a-z0-9-]{4,}/i

    expect(serialized).not.toMatch(uuidV1ToV5)
    expect(serialized).not.toMatch(accessSecret)
  })

  it('keeps autonomous data modules independent from private and stateful sources', () => {
    const sources = readTypeScriptFiles(GUIDE_DEMO_ROOT)
    const combinedSource = sources
      .map(file => `// ${file.path}\n${file.source}`)
      .join('\n')

    expect(combinedSource).not.toMatch(/@\/features\/guide-app/)
    expect(combinedSource).not.toMatch(/(?:@prisma\/client|\bPrisma\b)/)
    expect(combinedSource).not.toMatch(/next\/navigation/)
    expect(combinedSource).not.toMatch(/\b(?:cookie|localStorage|sessionStorage)\b/i)
    expect(combinedSource).not.toMatch(/\bfetch\s*\(/)
    expect(combinedSource).not.toMatch(/\/api\//)
  })
})
