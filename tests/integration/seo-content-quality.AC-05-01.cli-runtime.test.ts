import { spawnSync } from 'node:child_process'

describe('043 SEO audit CLI runtime', () => {
  it('loads under tsx and rejects an unsafe output before any database read', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        'scripts/audit-seo-content.ts',
        '--output',
        '../report.md',
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('docs/audits')
    expect(result.stderr).not.toContain("Cannot find module 'server-only'")
  })
})
