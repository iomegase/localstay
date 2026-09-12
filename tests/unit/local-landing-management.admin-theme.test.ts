import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import tailwindConfig from '../../tailwind.config'

describe('048 Admin landing Shadcn theme', () => {
  it('defines opaque popover tokens for Select content', () => {
    const globals = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    expect(globals).toContain('--popover:')
    expect(globals).toContain('--popover-foreground:')
    expect(tailwindConfig.theme?.extend?.colors).toMatchObject({
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
    })
  })
})
