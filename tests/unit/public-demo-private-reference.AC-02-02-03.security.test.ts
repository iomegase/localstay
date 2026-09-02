import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import * as ts from 'typescript'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import { isApprovedDemoLodgingMedia } from '@/features/guide-demo/demo-media-policy'

const GUIDE_DEMO_ROOT = join(process.cwd(), 'src/features/guide-demo')
const FORBIDDEN_DEMO_SPECIFIER =
  /(?:^@\/features\/guide-app(?:\/|$)|^@\/app\/api(?:\/|$)|^@prisma\/client$|(?:^|\/)prisma(?:\/|$)|(?:^|\/)queries?(?:\/|$)|(?:^|\/)(?:database|db)(?:\/|$)|^next\/(?:headers|navigation)$|^next\/cookies$|(?:^|\/)api(?:\/|$)|(?:^|\/)(?:storage|cookies?)(?:\/|$))/i

const AUTONOMOUS_DATA_MODULES = new Set([
  'demo-content.ts',
  'demo-guide-data.ts',
  'demo-media-policy.ts',
  'demo-poi-content.ts',
  'demo-pois.ts',
  'demo-trail-geometry.ts',
  'types.ts',
])

type AuditSourceFile = {
  absolutePath: string
  path: string
  source: string
  isGuideDemoSource: boolean
}

function readDirectTypeScriptFiles(directory: string): AuditSourceFile[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return readDirectTypeScriptFiles(absolutePath)
    }

    if (!/\.tsx?$/.test(entry.name)) {
      return []
    }

    return [
      {
        absolutePath,
        path: relative(directory, absolutePath),
        source: readFileSync(absolutePath, 'utf8'),
        isGuideDemoSource: true,
      },
    ]
  })
}

function resolvesWithinDirectory(path: string, directory: string): boolean {
  const pathFromDirectory = relative(directory, path)
  return !pathFromDirectory.startsWith('..') && !isAbsolute(pathFromDirectory)
}

function resolveLocalTypeScriptModule(
  importerPath: string,
  specifier: string,
  sourceRoot: string,
): string | null {
  let unresolvedPath: string

  if (isRelativeModuleSpecifier(specifier)) {
    unresolvedPath = resolve(dirname(importerPath), specifier)
  } else if (specifier.startsWith('@/')) {
    unresolvedPath = resolve(sourceRoot, specifier.slice(2))
  } else {
    return null
  }

  if (!resolvesWithinDirectory(unresolvedPath, sourceRoot)) {
    return null
  }

  const candidates = extname(unresolvedPath)
    ? [unresolvedPath]
    : [
        `${unresolvedPath}.ts`,
        `${unresolvedPath}.tsx`,
        join(unresolvedPath, 'index.ts'),
        join(unresolvedPath, 'index.tsx'),
      ]

  return (
    candidates.find(
      candidate =>
        resolvesWithinDirectory(candidate, sourceRoot) &&
        existsSync(candidate) &&
        /\.tsx?$/.test(candidate),
    ) ?? null
  )
}

function readTypeScriptFiles(
  directory: string,
  includeTransitive = false,
  sourceRoot = join(process.cwd(), 'src'),
): AuditSourceFile[] {
  const directFiles = readDirectTypeScriptFiles(directory)
  if (!includeTransitive) return directFiles

  const filesByPath = new Map<string, AuditSourceFile>()

  function visit(absolutePath: string, isGuideDemoSource: boolean) {
    if (filesByPath.has(absolutePath)) return

    const source = readFileSync(absolutePath, 'utf8')
    filesByPath.set(absolutePath, {
      absolutePath,
      path: relative(directory, absolutePath),
      source,
      isGuideDemoSource,
    })

    for (const dependency of readModuleDependencies(source)) {
      const resolvedPath = resolveLocalTypeScriptModule(
        absolutePath,
        dependency.specifier,
        sourceRoot,
      )
      if (resolvedPath) visit(resolvedPath, false)
    }
  }

  for (const file of directFiles) {
    visit(file.absolutePath, true)
  }

  return [...filesByPath.values()]
}

function readAutonomousDataFiles() {
  return readTypeScriptFiles(GUIDE_DEMO_ROOT).filter(file =>
    AUTONOMOUS_DATA_MODULES.has(file.path),
  )
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

type ModuleDependency = {
  kind: 'dynamic-import' | 'export' | 'import' | 'require'
  specifier: string
}

const NON_LITERAL_DYNAMIC_IMPORT = '<non-literal dynamic import>'

function readModuleDependencies(source: string): ModuleDependency[] {
  const sourceFile = ts.createSourceFile(
    'guide-demo-data.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  const dependencies: ModuleDependency[] = []

  function collect(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      dependencies.push({
        kind: ts.isImportDeclaration(node) ? 'import' : 'export',
        specifier: node.moduleSpecifier.text,
      })
    }

    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const specifier = node.arguments[0]
      dependencies.push({
        kind: 'dynamic-import',
        specifier:
          specifier && ts.isStringLiteralLike(specifier)
            ? specifier.text
            : NON_LITERAL_DYNAMIC_IMPORT,
      })
    }

    if (
      ts.isCallExpression(node) &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require'
    ) {
        dependencies.push({ kind: 'require', specifier: node.arguments[0].text })
    }

    ts.forEachChild(node, collect)
  }

  collect(sourceFile)
  return dependencies
}

function readStaticModuleSpecifiers(source: string): string[] {
  return readModuleDependencies(source).map(dependency => dependency.specifier)
}

function findRuntimeDependencyUses(source: string): string[] {
  const sourceFile = ts.createSourceFile(
    'guide-demo-runtime.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const uses = new Set<string>()

  function isGlobalObject(node: ts.Expression): boolean {
    return ts.isIdentifier(node) && /^(?:globalThis|window)$/.test(node.text)
  }

  function isHistoryTarget(node: ts.Expression): boolean {
    return (
      (ts.isIdentifier(node) && node.text === 'history') ||
      (ts.isPropertyAccessExpression(node) &&
        isGlobalObject(node.expression) &&
        node.name.text === 'history')
    )
  }

  function isLocationTarget(node: ts.Expression): boolean {
    return (
      (ts.isIdentifier(node) && node.text === 'location') ||
      (ts.isPropertyAccessExpression(node) &&
        isGlobalObject(node.expression) &&
        node.name.text === 'location')
    )
  }

  function isLocationAssignmentTarget(node: ts.Expression): boolean {
    return (
      isLocationTarget(node) ||
      (ts.isPropertyAccessExpression(node) &&
        node.name.text === 'href' &&
        isLocationTarget(node.expression))
    )
  }

  function isBrowserStorageTarget(node: ts.Expression): boolean {
    return (
      (ts.isIdentifier(node) && /^(?:localStorage|sessionStorage)$/.test(node.text)) ||
      (ts.isPropertyAccessExpression(node) &&
        isGlobalObject(node.expression) &&
        /^(?:localStorage|sessionStorage)$/.test(node.name.text))
    )
  }

  function collect(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'fetch') uses.add('fetch()')
      if (node.expression.text === 'cookies') uses.add('cookies()')
      if (node.expression.text === 'require') uses.add('require()')
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text
      if (
        /^(?:pushState|replaceState)$/.test(method) &&
        isHistoryTarget(node.expression.expression)
      ) {
        uses.add(node.expression.getText(sourceFile))
      }
      if (
        /^(?:assign|replace|reload)$/.test(method) &&
        isLocationTarget(node.expression.expression)
      ) {
        uses.add(node.expression.getText(sourceFile))
      }
      if (method === 'fetch' && isGlobalObject(node.expression.expression)) {
        uses.add(node.expression.getText(sourceFile))
      }
      if (isBrowserStorageTarget(node.expression.expression)) {
        uses.add(node.expression.expression.getText(sourceFile))
      }
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      isLocationAssignmentTarget(node.left)
    ) {
      uses.add(node.left.getText(sourceFile))
    }

    if (ts.isIdentifier(node) && /^(?:prisma|Prisma)$/.test(node.text)) {
      uses.add(node.text)
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      (isBrowserStorageTarget(node) ||
        (ts.isIdentifier(node.expression) &&
          /^(?:localStorage|sessionStorage)$/.test(node.expression.text)) ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'document' &&
          node.name.text === 'cookie'))
    ) {
      uses.add(node.getText(sourceFile))
    }

    ts.forEachChild(node, collect)
  }

  collect(sourceFile)
  return [...uses]
}

function readRouteLiteralDependencies(source: string): string[] {
  const sourceFile = ts.createSourceFile(
    'guide-demo-routes.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const routes: string[] = []

  function collect(node: ts.Node) {
    if (ts.isStringLiteralLike(node) && node.text.startsWith('/')) {
      routes.push(node.text)
    }
    ts.forEachChild(node, collect)
  }

  collect(sourceFile)
  return routes
}

function isRelativeModuleSpecifier(specifier: string): boolean {
  return /^\.\.?\//.test(specifier)
}

function resolvesWithinGuideDemo(
  sourcePath: string,
  specifier: string,
): boolean {
  if (!isRelativeModuleSpecifier(specifier)) return true

  const resolvedImport = resolve(
    GUIDE_DEMO_ROOT,
    dirname(sourcePath),
    specifier,
  )
  const pathFromDemoRoot = relative(GUIDE_DEMO_ROOT, resolvedImport)

  return !pathFromDemoRoot.startsWith('..') && !isAbsolute(pathFromDemoRoot)
}

function isAllowedDemoModuleSpecifier(
  sourcePath: string,
  specifier: string,
): boolean {
  return (
    (isRelativeModuleSpecifier(specifier) &&
      resolvesWithinGuideDemo(sourcePath, specifier)) ||
    specifier === 'react' ||
    specifier.startsWith('react/') ||
    specifier === 'next/dynamic' ||
    specifier === 'next/image' ||
    specifier === 'lucide-react' ||
    specifier.startsWith('@radix-ui/react-') ||
    specifier === 'framer-motion' ||
    specifier.startsWith('@/features/guide-demo/') ||
    specifier === '@/features/marketing/components/MarketingShell' ||
    specifier === '@/shared/components/brand/MyStayLogo' ||
    specifier === '@/shared/lib/french-place'
  )
}

function findUnsafeStayEntries(
  entries: Array<{ path: string; value: string }>,
): Array<{ path: string; value: string }> {
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
    /\.(?:accessCode|accessMedia|digicode|document(?:Id|Url)?|keyBox(?:Code)?|lock(?:Code)?|password|plaque|plateNumber|(?:host|owner|private)Phone)$/i

  return entries.filter(
    ({ path, value }) =>
      knownPrivateDetails.test(value) ||
      privateAddress.test(value) ||
      accessLanguage.test(value) ||
      vehiclePlate.test(value) ||
      privateDocument.test(value) ||
      sensitiveFixtureField.test(path),
  )
}

describe('public demo security guard helpers', () => {
  it('rejects alphanumeric access secrets even when labelled as fictional examples', () => {
    const attacks = collectStringEntries(
      {
        first: 'Exemple fictif : digicode AB12CD',
        second: 'Mot de passe ExempleAzerty',
      },
      'attackFixture',
    )

    expect(findUnsafeStayEntries(attacks)).toEqual(attacks)
  })

  it('discovers imports and every static re-export module specifier', () => {
    const source = [
      "import { demo } from './demo-content'",
      "export { privateData } from '../private/data'",
      "export type { PrivateType } from '@/features/guide-app/types'",
      "export * from './types'",
    ].join('\n')

    expect(readStaticModuleSpecifiers(source)).toEqual([
      './demo-content',
      '../private/data',
      '@/features/guide-app/types',
      './types',
    ])
  })

  it('rejects relative imports that escape the demo folder across every import form', () => {
    const dependencies = readModuleDependencies(
      [
        "import { GuideApp } from '../../guide-app/components/GuideApp'",
        "export { createClient } from '../../../shared/lib/supabase'",
        "void import('../../private/actions')",
        "require('../../private/actions')",
      ].join('\n'),
    )

    expect(dependencies).toEqual([
      { kind: 'import', specifier: '../../guide-app/components/GuideApp' },
      { kind: 'export', specifier: '../../../shared/lib/supabase' },
      { kind: 'dynamic-import', specifier: '../../private/actions' },
      { kind: 'require', specifier: '../../private/actions' },
    ])
    expect(
      dependencies.filter(
        dependency =>
          !isAllowedDemoModuleSpecifier(
            'components/DemoGuideModal.tsx',
            dependency.specifier,
          ),
      ),
    ).toEqual(dependencies)
  })

  it('rejects a dynamic import whose source cannot be resolved statically', () => {
    const dependencies = readModuleDependencies(
      "const target = '../../private/actions'; void import(target)",
    )

    expect(dependencies).toEqual([
      { kind: 'dynamic-import', specifier: '<non-literal dynamic import>' },
    ])
    expect(
      isAllowedDemoModuleSpecifier(
        'components/DemoGuideModal.tsx',
        dependencies[0].specifier,
      ),
    ).toBe(false)
  })

  it('detects direct history and location mutations as stateful navigation', () => {
    const source = [
      "history.pushState({}, '', '/sejour')",
      "window.history.replaceState({}, '', '/guide')",
      "window.location.assign('/map')",
      "location.href = '/mes-favoris'",
    ].join('\n')

    expect(findRuntimeDependencyUses(source)).toEqual(
      expect.arrayContaining([
        'history.pushState',
        'window.history.replaceState',
        'window.location.assign',
        'location.href',
      ]),
    )
  })

  it('detects global network and browser-storage calls', () => {
    const source = [
      "globalThis.fetch('/api/demo')",
      "window.fetch('/api/demo')",
      "globalThis.localStorage.getItem('demo')",
      "window.sessionStorage.setItem('demo', '1')",
    ].join('\n')

    expect(findRuntimeDependencyUses(source)).toEqual(
      expect.arrayContaining([
        'globalThis.fetch',
        'window.fetch',
        'globalThis.localStorage',
        'window.sessionStorage',
      ]),
    )
  })

  it('traverses allowed local modules and discovers a transitive private query fixture', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'guide-demo-audit-'))
    const sourceRoot = join(fixtureRoot, 'src')
    const demoRoot = join(sourceRoot, 'features/guide-demo')
    const bridgePath = join(sourceRoot, 'shared/lib/demo-bridge.ts')
    const queryPath = join(sourceRoot, 'features/private/queries/secret.ts')

    try {
      mkdirSync(join(demoRoot, 'components'), { recursive: true })
      mkdirSync(dirname(bridgePath), { recursive: true })
      mkdirSync(dirname(queryPath), { recursive: true })
      writeFileSync(
        join(demoRoot, 'components/Entry.tsx'),
        "import '@/shared/lib/demo-bridge'",
      )
      writeFileSync(
        bridgePath,
        "import '@/features/private/queries/secret'",
      )
      writeFileSync(queryPath, 'export const FORBIDDEN_TRANSITIVE_QUERY = true')

      const sources = readTypeScriptFiles(demoRoot, true, sourceRoot)

      expect(sources.map(file => file.source).join('\n')).toContain(
        'FORBIDDEN_TRANSITIVE_QUERY',
      )
      expect(
        sources.flatMap(file => readModuleDependencies(file.source)).filter(
          dependency => dependency.specifier.includes('/queries/'),
        ),
      ).toEqual([
        { kind: 'import', specifier: '@/features/private/queries/secret' },
      ])
      expect(
        sources
          .flatMap(file => readModuleDependencies(file.source))
          .filter(dependency =>
            FORBIDDEN_DEMO_SPECIFIER.test(dependency.specifier),
          ),
      ).toEqual([
        { kind: 'import', specifier: '@/features/private/queries/secret' },
      ])
    } finally {
      rmSync(fixtureRoot, { force: true, recursive: true })
    }
  })
})

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

    expect(fixtureIdGroups.favoritePois).toEqual([
      'demo-poi-rond-de-carotte',
      'demo-poi-communailles',
      'demo-poi-hautetour',
      'demo-poi-tramway',
      'demo-poi-porcherey',
    ])
    expect(fixtureIdGroups.lodgingCards).toEqual([
      'demo-chalet-des-cimes',
      'demo-studio-du-parc',
    ])
    expect(fixtureIdGroups.blogPosts).toEqual([
      'demo-blog-week-end-saint-gervais',
      'demo-blog-escapade-montagne',
    ])
    expect(fixtureIdGroups.practicalCards).toEqual([
      'demo-television',
      'demo-heating',
      'demo-kitchen',
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
    const unsafeStayValues = findUnsafeStayEntries(stayEntries)

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
    const sources = readAutonomousDataFiles()
    const combinedSource = sources
      .map(file => `// ${file.path}\n${file.source}`)
      .join('\n')

    expect(sources.map(file => file.path).sort()).toEqual(
      [...AUTONOMOUS_DATA_MODULES].sort(),
    )

    for (const file of sources) {
      const moduleSpecifiers = readStaticModuleSpecifiers(file.source)

      for (const specifier of moduleSpecifiers) {
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
      readStaticModuleSpecifiers(demoContentSource?.source ?? ''),
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

  it('keeps every guide-demo module free of private, data, navigation, and network dependencies', () => {
    const privateRoute =
      /^\/(?:sejour|le-logement|nos-recommandations|map|mes-favoris|guide)(?:\/|$)/
    const violations: Array<{
      file: string
      dependency: string
      kind: string
    }> = []

    for (const file of readTypeScriptFiles(GUIDE_DEMO_ROOT, true)) {
      for (const dependency of readModuleDependencies(file.source)) {
        if (
          dependency.specifier === NON_LITERAL_DYNAMIC_IMPORT ||
          FORBIDDEN_DEMO_SPECIFIER.test(dependency.specifier) ||
          (file.isGuideDemoSource &&
            !isAllowedDemoModuleSpecifier(file.path, dependency.specifier))
        ) {
          violations.push({
            file: file.path,
            dependency: dependency.specifier,
            kind: dependency.kind,
          })
        }
      }

      for (const dependency of findRuntimeDependencyUses(file.source)) {
        violations.push({ file: file.path, dependency, kind: 'runtime' })
      }

      for (const route of readRouteLiteralDependencies(file.source)) {
        if (privateRoute.test(route) || route.startsWith('/api/')) {
          violations.push({ file: file.path, dependency: route, kind: 'route' })
        }
      }
    }

    expect(violations).toEqual([])
  })
})
