import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Story Script public font', () => {
  it('loads Story Script and maps the owner handwriting alias to it', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    const tailwind = readFileSync(join(process.cwd(), 'tailwind.config.ts'), 'utf8')

    expect(layout).toContain('Story_Script')
    expect(layout).toContain("variable: '--font-story'")
    expect(layout).toContain('storyScript.variable')
    expect(layout).not.toContain('Dancing_Script')
    expect(tailwind).toContain("hand: ['var(--font-story)', 'cursive']")
  })
})
