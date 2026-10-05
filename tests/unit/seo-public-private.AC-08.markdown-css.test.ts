import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

it('AC-08-02 generates quoted attribute selectors for Markdown heading sizes', async () => {
  const source = readFileSync('src/features/blog/components/BlogMarkdown.tsx', 'utf8')
  const result = await postcss([tailwindcss({
    content: [{ raw: source, extension: 'tsx' }],
    corePlugins: { preflight: false },
  })]).process('@tailwind utilities;', { from: undefined })
  expect(result.css).toContain("h2[data-markdown-depth='1']")
  expect(result.css).not.toContain('h2[data-markdown-depth=1]')
  expect(result.css).toContain('font-size: 30px')
})
