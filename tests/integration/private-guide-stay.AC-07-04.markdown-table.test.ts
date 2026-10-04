import { execFileSync } from 'node:child_process'

it('AC-07-04: renders a real GFM table with internal scrolling and safe Markdown', () => {
  const code = `const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server'); const {GuideBlogMarkdown}=require('./src/features/guide-app/components/GuideBlogMarkdown.tsx'); console.log(renderToStaticMarkup(React.createElement(GuideBlogMarkdown,{source: "| Catégorie | Surface |\\n| --- | --- |\\n| 1 étoile | 12 m² |\\n\\n[Danger](javascript:alert)"})));`
  const html = execFileSync(process.execPath, ['--import', 'tsx', '-e', code], { encoding: 'utf8' })
  expect(html).toContain('<table')
  expect(html).toContain('scope="col"')
  expect(html).toContain('12 m²')
  expect(html).toContain('overflow-x-auto')
  expect(html).not.toContain('href="javascript:')
})


it('AC-07-05: renders justified 14px prose and 12px sources with section boundaries', () => {
  const markdown = 'Paragraphe du guide.\n\n## Sources\n\n[Office](https://example.com)\n\n- Référence officielle\n\n## Suite\n\nTexte suivant.'
  const code = `const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server'); const {GuideBlogMarkdown}=require('./src/features/guide-app/components/GuideBlogMarkdown.tsx'); console.log(renderToStaticMarkup(React.createElement(GuideBlogMarkdown,{source: ${JSON.stringify(markdown)}})));`
  const html = execFileSync(process.execPath, ['--import', 'tsx', '-e', code], { encoding: 'utf8' })
  expect(html).toContain('text-[14px]')
  expect(html).toContain('[&amp;_p]:text-justify')
  expect(html).toContain('<p class="text-[12px]"><a href="https://example.com">Office</a></p>')
  expect(html).toContain('<ul class="text-[12px]">')
  expect(html).toContain('<p>Texte suivant.</p>')
})
