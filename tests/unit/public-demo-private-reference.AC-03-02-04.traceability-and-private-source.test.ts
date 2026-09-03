/** @jest-environment node */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import * as ts from 'typescript'

const TRACEABILITY_MATRIX = join(
  process.cwd(),
  'docs/traceability-matrix.md',
)
const SOURCE_ROOT = join(process.cwd(), 'src')
const PROTECTED_PRIVATE_ROOTS = [
  join(SOURCE_ROOT, 'features/guide-app'),
  join(SOURCE_ROOT, 'app/(public)/sejour'),
  join(SOURCE_ROOT, 'app/(public)/le-logement'),
  join(SOURCE_ROOT, 'app/(public)/nos-recommandations'),
  join(SOURCE_ROOT, 'app/(public)/map'),
  join(SOURCE_ROOT, 'app/(public)/mes-favoris'),
]

type ProtectedSourceFile = {
  absolutePath: string
  relativePath: string
  source: string
}

function readTypeScriptFiles(directory: string): ProtectedSourceFile[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return readTypeScriptFiles(absolutePath)
    }

    if (!/\.tsx?$/.test(entry.name)) {
      return []
    }

    return [
      {
        absolutePath,
        relativePath: relative(SOURCE_ROOT, absolutePath),
        source: readFileSync(absolutePath, 'utf8'),
      },
    ]
  })
}

function isRelativeModuleSpecifier(specifier: string): boolean {
  return /^\.\.?\//.test(specifier)
}

function resolveLocalTypeScriptModule(
  importerPath: string,
  specifier: string,
): string | null {
  let unresolvedPath: string

  if (isRelativeModuleSpecifier(specifier)) {
    unresolvedPath = resolve(dirname(importerPath), specifier)
  } else if (specifier.startsWith('@/')) {
    unresolvedPath = resolve(SOURCE_ROOT, specifier.slice(2))
  } else {
    return null
  }

  const candidates = unresolvedPath.match(/\.tsx?$/)
    ? [unresolvedPath]
    : [
        `${unresolvedPath}.ts`,
        `${unresolvedPath}.tsx`,
        join(unresolvedPath, 'index.ts'),
        join(unresolvedPath, 'index.tsx'),
      ]

  return (
    candidates.find(candidate => {
      const relativeCandidate = relative(SOURCE_ROOT, candidate)
      return !relativeCandidate.startsWith('..') && !isAbsolute(relativeCandidate)
    }) ?? null
  )
}

function readModuleSpecifiers(source: string): string[] {
  const sourceFile = ts.createSourceFile(
    'protected-source.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const specifiers: string[] = []

  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return specifiers
}

describe('045 private regression traceability and source isolation', () => {
  it('records dedicated traceability rows for AC-03-02 and AC-03-04 with their real regression suites', () => {
    const matrix = readFileSync(TRACEABILITY_MATRIX, 'utf8')

    expect(matrix).toContain(
      '| `045-public-demo-private-guide-reference` | US-03 | AC-03-02 |',
    )
    expect(matrix).toContain(
      'tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts',
    )
    expect(matrix).toContain('tests/unit/proxy.guest-confinement.test.ts')
    expect(matrix).toContain(
      'tests/unit/seo-public-private.AC-01-01.private-metadata.test.ts',
    )
    expect(matrix).toContain(
      'tests/integration/seo-public-private.AC-01-02.legacy-private-metadata.test.tsx',
    )
    expect(matrix).toContain(
      'tests/e2e/qr-code.AC-01-01-02.scan-redirect.test.ts',
    )

    expect(matrix).toContain(
      '| `045-public-demo-private-guide-reference` | US-03 | AC-03-04 |',
    )
    expect(matrix).toContain(
      'tests/integration/private-guide-app.AC-03-04.demo-isolation.test.tsx',
    )
    expect(matrix).toContain(
      'tests/unit/public-demo-private-reference.AC-03-02-04.traceability-and-private-source.test.ts',
    )
  })

  it('keeps every protected private source free of guide-demo imports, demo-prefixed ids, and demo copy', () => {
    const files = PROTECTED_PRIVATE_ROOTS.flatMap(root => readTypeScriptFiles(root))
    const violations = files.flatMap(file => {
      const importViolations = readModuleSpecifiers(file.source).flatMap(
        specifier => {
          const resolvedPath = resolveLocalTypeScriptModule(
            file.absolutePath,
            specifier,
          )
          const relativeResolvedPath = resolvedPath
            ? relative(SOURCE_ROOT, resolvedPath)
            : null

          if (
            specifier.startsWith('@/features/guide-demo/') ||
            relativeResolvedPath?.startsWith('features/guide-demo/')
          ) {
            return [`${file.relativePath} imports ${specifier}`]
          }

          return []
        },
      )

      const literalViolations =
        /(?:autonomous-demo-guide|Guide MyStay de démonstration|Voir le guide d['’]exemple|data-guide-mode=["']demo["']|demo-[a-z0-9-]+)/i.test(
          file.source,
        )
          ? [`${file.relativePath} contains demo-only literals`]
          : []

      return [...importViolations, ...literalViolations]
    })

    expect(violations).toEqual([])
  })
})
