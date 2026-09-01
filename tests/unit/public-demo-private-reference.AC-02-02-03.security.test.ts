import { readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import { isApprovedDemoLodgingMedia } from '@/features/guide-demo/demo-media-policy'

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

function readStaticImportSpecifiers(source: string): string[] {
  const importPattern =
    /^\s*import\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm

  return [...source.matchAll(importPattern)].map(match => match[1])
}

describe('public demo private-guide isolation', () => {
  it('exposes complete deterministic demo fixtures', () => {
    expect(demoGuideData.favoritePois.length).toBeGreaterThan(0)
    expect(demoGuideData.lodgingCards.length).toBeGreaterThan(0)
    expect(demoGuideData.blogPosts.length).toBeGreaterThan(0)
    expect(demoGuideData.contact.lodgingName).toBe(
      'Le 305 — démonstration',
    )
    expect(demoGuideData.lodging).toHaveProperty('bedroomCount', 2)
    expect(demoGuideData.lodging).not.toHaveProperty('bedrooms')
    expect(demoGuideData.lodging.usefulNumbers).toEqual([
      { label: 'Office de tourisme', number: '04 50 47 76 08' },
    ])
    expect(demoGuideData.lodging).toHaveProperty('emergencyNumbers', [
      { label: 'Urgences européennes', number: '112' },
      { label: 'SAMU', number: '15' },
      { label: 'Pompiers', number: '18' },
    ])

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

    const fixtureIdGroups = {
      favoritePois: demoGuideData.favoritePois.map(poi => poi.id),
      lodgingCards: demoGuideData.lodgingCards.map(lodging => lodging.id),
      blogPosts: demoGuideData.blogPosts.map(post => post.id),
      practicalCards: demoGuideData.lodging.practicalCards.map(card => card.id),
    }
    for (const [group, ids] of Object.entries(fixtureIdGroups)) {
      expect({ group, uniqueIds: new Set(ids).size }).toEqual({
        group,
        uniqueIds: ids.length,
      })
    }

    expect(fixtureIdGroups.favoritePois).toEqual(
      expect.arrayContaining([
        'demo-poi-rond-de-carotte',
        'demo-poi-porcherey',
      ]),
    )
    expect(fixtureIdGroups.lodgingCards).toEqual([
      'demo-chalet-des-cimes',
      'demo-studio-du-parc',
    ])
    expect(fixtureIdGroups.blogPosts).toEqual([
      'demo-blog-week-end-saint-gervais',
      'demo-blog-escapade-montagne',
    ])
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
    const privateAddress =
      /\b\d{1,5}\s+(?:all[ée]e|avenue|boulevard|chemin|impasse|passage|place|route|rue)\b/i
    const accessLanguage =
      /(?:\bdigicode\b|code d['’]acc[eè]s|bo[iî]te [àa] cl[ée]s?|\bserrure\b|mot de passe|\bpassword\b|\bpin\s*(?::|=)\s*[a-z0-9-]{4,})/i
    const explanatoryFictionalLanguage =
      /(?:ficti(?:f|ve)|d[ée]monstration|exemple|non[- ]r[ée]el|aucun(?:e)?|ne\s+\S+\s+pas)/i
    const numericAccessSecret =
      /(?:\bdigicode\b|code d['’]acc[eè]s|bo[iî]te [àa] cl[ée]s?|\bserrure\b|mot de passe|\bpassword\b|\bpin\b)[^.!?\n]{0,48}\b\d{3,8}\b/i
    const vehiclePlate =
      /(?:plaque d['’]immatriculation|\bimmatriculation\b|\b[a-z]{2}-\d{3}-[a-z]{2}\b)/i
    const privateDocument =
      /(?:passeport|pi[eè]ce d['’]identit[ée]|document (?:d['’]acc[eè]s|de voyage|priv[ée])|\.(?:docx?|pdf|xlsx?)(?:[?#]|$))/i
    const knownPrivateDetails =
      /300 route du Mont-Blanc|1789|Bienvenue2026|Refuge-Mont-Blanc/i
    const sensitiveFixtureField =
      /\.(?:accessCode|accessMedia|digicode|document(?:Id|Url)?|keyBox(?:Code)?|lock(?:Code)?|password|plaque|plateNumber|(?:host|owner|private)Phone)$/i

    const unsafeStayValues = stayEntries.filter(
      ({ path, value }) =>
        knownPrivateDetails.test(value) ||
        privateAddress.test(value) ||
        numericAccessSecret.test(value) ||
        vehiclePlate.test(value) ||
        privateDocument.test(value) ||
        sensitiveFixtureField.test(path) ||
        (accessLanguage.test(value) &&
          !explanatoryFictionalLanguage.test(value)),
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
    expect(serialized).not.toMatch(uuidV1ToV5)
    expect(demoGuideData.lodging.wifiName).toBe('MyStay-Demo')
    expect(demoGuideData.lodging.wifiPassword).toBe('Exemple-Non-Reel')
    expect(demoGuideData.lodging.addressLabel).toBe(
      'Résidence de démonstration, centre de Saint-Gervais',
    )
    expect(demoGuideData.lodging.trashLocation).toBe(
      'Point de tri public du centre de Saint-Gervais',
    )
    expect(unsafeStayValues).toEqual([])
    expect(unexpectedPrivatePhones).toEqual([])
    for (const media of stayMedia) {
      expect({ media, approved: isApprovedDemoLodgingMedia(media) }).toEqual({
        media,
        approved: true,
      })
    }
  })

  it('keeps autonomous data modules independent from private and stateful sources', () => {
    const sources = readTypeScriptFiles(GUIDE_DEMO_ROOT)
    const combinedSource = sources
      .map(file => `// ${file.path}\n${file.source}`)
      .join('\n')

    expect(sources.map(file => file.path).sort()).toEqual(
      [...AUTONOMOUS_DATA_MODULES].sort(),
    )

    for (const file of sources) {
      const importSpecifiers = readStaticImportSpecifiers(file.source)

      for (const specifier of importSpecifiers) {
        const resolvedImport = resolve(
          GUIDE_DEMO_ROOT,
          dirname(file.path),
          specifier,
        )
        const pathFromDemoRoot = relative(GUIDE_DEMO_ROOT, resolvedImport)

        expect({ file: file.path, specifier }).toEqual({
          file: file.path,
          specifier: expect.stringMatching(/^\.\.?\//),
        })
        expect(
          pathFromDemoRoot.startsWith('..') || isAbsolute(pathFromDemoRoot),
        ).toBe(false)
      }

      expect(file.source).not.toMatch(/\b(?:import|require)\s*\(/)
    }

    const demoContentSource = sources.find(
      file => file.path === 'demo-content.ts',
    )
    expect(
      readStaticImportSpecifiers(demoContentSource?.source ?? ''),
    ).toContain('./demo-media-policy')
    expect(demoContentSource?.source).not.toMatch(
      /['"]\/marketing\/(?:guide-interior|demo-lodging-[^'"]*)['"]/,
    )

    expect(combinedSource).not.toMatch(
      /(?:next\/headers|\bcookies?\s*\(|\bdocument\.cookie\b|\bcookieStore\b|\b(?:delete|get|parse|set)Cookies?\s*\()/i,
    )
    expect(combinedSource).not.toMatch(/\b(?:localStorage|sessionStorage)\b/i)
    expect(combinedSource).not.toMatch(/\bfetch\s*\(/i)
    expect(combinedSource).not.toMatch(/\/api\//i)
  })
})
