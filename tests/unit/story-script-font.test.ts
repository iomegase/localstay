import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Story Script public font', () => {
  it('loads Story Script and maps the owner handwriting alias to it', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    const tailwind = readFileSync(join(process.cwd(), 'tailwind.config.ts'), 'utf8')

    expect(layout).toContain('family=Story+Script')
    expect(layout).not.toContain('Dancing+Script')
    expect(tailwind).toContain("hand: ['Story Script', 'cursive']")
  })
})
