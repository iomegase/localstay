import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const activeBrandFiles = [
  'src/app/(auth)/layout.tsx',
  'src/app/(dashboard)/layout.tsx',
  'src/app/admin/layout.tsx',
] as const

describe('approved brand identity legacy cleanup', () => {
  it.each(activeBrandFiles)(
    'removes the active /logo.png reference from %s',
    relativePath => {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8')

      expect(source).not.toContain('src="/logo.png"')
    },
  )

  it.each(activeBrandFiles)(
    'does not recolor the approved logo with CSS filters in %s',
    relativePath => {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
      const logoLines = source
        .split('\n')
        .filter(line => line.includes('MyStayLogo'))
        .join('\n')

      expect(logoLines).not.toMatch(/\b(?:brightness|invert|filter)\b/)
    },
  )
})
