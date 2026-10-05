import { execFileSync } from 'node:child_process'

it('AC-02-06: renders a real GFM table with internal scrolling and safe Markdown', () => {
  const code = `const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server'); const {BlogMarkdown}=require('./src/features/blog/components/BlogMarkdown.tsx'); console.log(renderToStaticMarkup(React.createElement(BlogMarkdown,{source: "| Catégorie | Surface |\\n| --- | --- |\\n| 1 étoile | 12 m² |\\n\\n[Danger](javascript:alert)"})));`
  const html = execFileSync(process.execPath, ['--import', 'tsx', '-e', code], { encoding: 'utf8' })
  expect(html).toContain('<table')
  expect(html).toContain('scope="col"')
  expect(html).toContain('12 m²')
  expect(html).toContain('overflow-x-auto')
  expect(html).not.toContain('href="javascript:')
})


