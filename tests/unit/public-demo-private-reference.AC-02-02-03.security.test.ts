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

function collectInternalIds(
  value: unknown,
  path = 'demoGuideData',
): Array<{ path: string; id: string }> {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectInternalIds(item, `${path}[${index}]`),
    )
  }

  if (value === null || typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const current =
    typeof record.id === 'string' ? [{ path, id: record.id }] : []

  return [
    ...current,
    ...Object.entries(record).flatMap(([key, item]) =>
      key === 'id' ? [] : collectInternalIds(item, `${path}.${key}`),
    ),
  ]
}

function collectStringEntries(
  value: unknown,
  path = 'fixture',
): Array<{ path: string; value: string }> {
  if (typeof value === 'string') {
    return [{ path, value }]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectStringEntries(item, `${path}[${index}]`),
    )
  }

  if (value === null || typeof value !== 'object') {
    return []
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, item]) => collectStringEntries(item, `${path}.${key}`),
  )
}

function normalizePhoneNumber(value: string): string {
  return value.replace(/[^+\d]/g, '')
}

describe('public demo private-guide isolation', () => {
  it('exposes complete deterministic demo fixtures', () => {
    expect(demoGuideData.favoritePois.length).toBeGreaterThan(0)
    expect(demoGuideData.lodgingCards.length).toBeGreaterThan(0)
    expect(demoGuideData.blogPosts.length).toBeGreaterThan(0)
    expect(demoGuideData.contact.lodgingName).toBe(
      'Le 305 — démonstration',
    )

    const expectedEntities = [
      { path: 'demoGuideData.lodging', id: demoGuideData.lodging.id },
      ...demoGuideData.favoritePois.map((poi, index) => ({
        path: `demoGuideData.favoritePois[${index}]`,
        id: poi.id,
      })),
      ...demoGuideData.lodgingCards.map((lodging, index) => ({
        path: `demoGuideData.lodgingCards[${index}]`,
        id: lodging.id,
      })),
      ...demoGuideData.blogPosts.map((post, index) => ({
        path: `demoGuideData.blogPosts[${index}]`,
        id: post.id,
      })),
      ...demoGuideData.lodging.practicalCards.map((card, index) => ({
        path: `demoGuideData.lodging.practicalCards[${index}]`,
        id: card.id,
      })),
    ]
    const internalIds = collectInternalIds(demoGuideData)

    expect(internalIds).toEqual(expect.arrayContaining(expectedEntities))
    for (const entity of internalIds) {
      expect(entity).toEqual({
        path: entity.path,
        id: expect.stringMatching(/^demo-/),
      })
    }
  })

  it('contains no real identifiers or sensitive lodging-access details', () => {
    const serialized = JSON.stringify(demoGuideData)
    const uuidV1ToV5 =
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
    const stayFixtures = {
      lodging: demoGuideData.lodging,
      lodgingCards: demoGuideData.lodgingCards,
      blogPosts: demoGuideData.blogPosts,
      contact: demoGuideData.contact,
    }
    const stayEntries = collectStringEntries(stayFixtures, 'stayFixtures')
    const stayValues = stayEntries.map(entry => entry.value)
    const explicitlyFictional =
      /(?:ficti(?:f|ve)|d[ée]monstration|exemple|non[- ]r[ée]el|aucun(?:e)?|ne\s+\S+\s+pas)/i
    const privateAddress =
      /\b\d{1,5}\s+(?:all[ée]e|avenue|boulevard|chemin|impasse|passage|place|route|rue)\b/i
    const accessLanguage =
      /(?:\bdigicode\b|code d['’]acc[eè]s|bo[iî]te [àa] cl[ée]s?|\bserrure\b|mot de passe|\bpassword\b|\bpin\s*(?::|=)\s*[a-z0-9-]{4,})/i
    const vehiclePlate =
      /(?:plaque d['’]immatriculation|\bimmatriculation\b|\b[a-z]{2}-\d{3}-[a-z]{2}\b)/i
    const privateDocument =
      /(?:passeport|pi[eè]ce d['’]identit[ée]|document (?:d['’]acc[eè]s|de voyage|priv[ée])|\.(?:docx?|pdf|xlsx?)(?:[?#]|$))/i
    const knownPrivateDetails =
      /300 route du Mont-Blanc|1789|Bienvenue2026|Refuge-Mont-Blanc/i
    const sensitiveFixtureField =
      /\.(?:accessCode|digicode|documentUrl|keyBox|lockCode|password|plateNumber|wifiPassword)$/i

    const unsafeStayValues = stayEntries.filter(
      ({ path, value }) =>
        knownPrivateDetails.test(value) ||
        (!explicitlyFictional.test(value) &&
          (privateAddress.test(value) ||
            accessLanguage.test(value) ||
            vehiclePlate.test(value) ||
            privateDocument.test(value) ||
            sensitiveFixtureField.test(path))),
    )

    const privatePhonePattern =
      /(?<!\d)(?:\+33\s?[1-9]|0[1-9])(?:[ .-]?\d{2}){4}(?!\d)/g
    const allowedPublicPhoneNumbers = new Set(['0450477608'])
    const unexpectedPrivatePhones = stayValues
      .flatMap(value => value.match(privatePhonePattern) ?? [])
      .map(normalizePhoneNumber)
      .filter(number => !allowedPublicPhoneNumbers.has(number))

    const stayMedia = [
      demoGuideData.lodging.coverImage,
      ...demoGuideData.lodging.gallery,
      ...(demoGuideData.lodging.presentationVideoUrl
        ? [demoGuideData.lodging.presentationVideoUrl]
        : []),
      ...demoGuideData.lodging.arrivalInstructions.flatMap(instruction => [
        ...(instruction.videoUrl ? [instruction.videoUrl] : []),
        ...instruction.photos,
      ]),
      ...demoGuideData.lodging.practicalCards.flatMap(card => [
        ...(card.photoUrl ? [card.photoUrl] : []),
        ...(card.videoUrl ? [card.videoUrl] : []),
      ]),
      ...demoGuideData.lodgingCards.flatMap(card => [
        card.coverPhotoUrl,
        ...card.photos.map(photo => photo.url),
      ]),
      ...demoGuideData.blogPosts.map(post => post.coverUrl),
    ]
    const sensitiveAccessMedia =
      /\/(?:[^/]*(?:access|arrival|arriv[ée]e|digicode|document|door|entry|key|lock|plaque|private|serrure)[^/]*)\.(?:avif|jpe?g|pdf|png|webp|mov|mp4)(?:[?#]|$)/i

    expect(serialized).not.toMatch(uuidV1ToV5)
    expect(unsafeStayValues).toEqual([])
    expect(unexpectedPrivatePhones).toEqual([])
    expect(stayMedia.filter(media => sensitiveAccessMedia.test(media))).toEqual(
      [],
    )
  })

  it('keeps autonomous data modules independent from private and stateful sources', () => {
    const sources = readTypeScriptFiles(GUIDE_DEMO_ROOT)
    const combinedSource = sources
      .map(file => `// ${file.path}\n${file.source}`)
      .join('\n')

    expect(sources.map(file => file.path).sort()).toEqual(
      [...AUTONOMOUS_DATA_MODULES].sort(),
    )
    expect(combinedSource).not.toMatch(/@\/features\/guide-app/i)
    expect(combinedSource).not.toMatch(
      /(?:@\/shared\/lib\/prisma|@prisma\/client|\bprisma\b)/i,
    )
    expect(combinedSource).not.toMatch(
      /(?:\/queries\/|private-guide-data|\b(?:fetch|get|load|read)PrivateGuide(?:Data)?\b)/i,
    )
    expect(combinedSource).not.toMatch(/next\/navigation/i)
    expect(combinedSource).not.toMatch(
      /(?:next\/headers|\bcookies?\s*\(|\bdocument\.cookie\b|\bcookieStore\b|\b(?:delete|get|parse|set)Cookies?\s*\()/i,
    )
    expect(combinedSource).not.toMatch(/\b(?:localStorage|sessionStorage)\b/i)
    expect(combinedSource).not.toMatch(/\bfetch\s*\(/i)
    expect(combinedSource).not.toMatch(/\/api\//i)
  })
})
