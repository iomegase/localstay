import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

function fontConfiguration(source: string, fontName: string): string {
  const match = source.match(new RegExp(`${fontName}\\(\\{([\\s\\S]*?)\\n\\}\\)`))
  expect(match).not.toBeNull()
  return match?.[1] ?? ''
}

describe('Story Script public font', () => {
  it('loads Story Script and maps the owner handwriting alias to it', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    const tailwind = readFileSync(join(process.cwd(), 'tailwind.config.ts'), 'utf8')
    const storyScript = fontConfiguration(layout, 'Story_Script')

    expect(layout).toContain('Story_Script')
    expect(storyScript).toContain("variable: '--font-story'")
    expect(storyScript).toMatch(/preload:\s*false/)
    expect(layout).toContain('storyScript.variable')
    expect(layout).not.toContain('Dancing_Script')
    expect(tailwind).toContain("hand: ['var(--font-story)', 'cursive']")
  })

  it('keeps active root fonts and disables decorative Big Shoulders preloading', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    const bigShoulders = fontConfiguration(layout, 'Big_Shoulders_Inline')

    expect(layout).toContain('Plus_Jakarta_Sans')
    expect(layout).toContain('Playfair_Display')
    expect(bigShoulders).toMatch(/preload:\s*false/)
    expect(layout).toContain('bigShouldersInline.variable')
  })

  it('does not load or expose unused Quicksand and Lobster font aliases', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    const tailwind = readFileSync(join(process.cwd(), 'tailwind.config.ts'), 'utf8')
    const source = sourceFiles(join(process.cwd(), 'src'))
      .map(path => readFileSync(path, 'utf8'))
      .join('\n')

    expect(layout).not.toMatch(/\bQuicksand\b/)
    expect(layout).not.toMatch(/\bLobster\b/)
    expect(layout).not.toContain('--font-quicksand')
    expect(layout).not.toContain('--font-lobster')
    expect(tailwind).not.toMatch(/\bquicksand\s*:/)
    expect(tailwind).not.toMatch(/\blobster\s*:/)
    expect(source).not.toMatch(/font-(?:quicksand|lobster)\b/)
  })
})
