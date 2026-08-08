import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const activeConsumers = [
  'src/features/marketing/components/MarketingHome.tsx',
  'src/app/(public)/seminaires/page.tsx',
  'src/features/guide-demo/demo-guide-data.ts',
  'src/features/guide-app/queries/private-guide-data.ts',
] as const

describe('031 public marketing BR-35 — versioned hero cache key', () => {
  it.each(activeConsumers)('%s uses no stale hero-chalet.png cache key', relativePath => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
    expect(source).not.toContain('/marketing/hero-chalet.png')
  })

  it.each(activeConsumers)('%s uses hero-chalet-v2.png when it needs the shared hero', relativePath => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
    expect(source).toContain('/marketing/hero-chalet-v2.png')
  })
})
