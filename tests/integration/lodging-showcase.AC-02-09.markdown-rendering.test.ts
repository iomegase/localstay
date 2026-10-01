import { execFileSync } from 'node:child_process'

// Un processus Node charge le vrai react-markdown ESM, remplacé par un stub dans Jest.
it('AC-02-09 renders Markdown formatting without executing raw HTML or unsafe links', () => {
  const html = execFileSync(process.execPath, ['--import', 'tsx', '-e', `
    const React = require('react');
    global.React = React;
    const { renderToStaticMarkup } = require('react-dom/server');
    const { MarkdownText } = require('./src/shared/components/MarkdownText.tsx');
    process.stdout.write(renderToStaticMarkup(React.createElement(MarkdownText, {
      source: '**Chalet** avec *terrasse*\\n\\n- Vue montagne\\n- [Découvrir](https://example.com)\\n\\n<script>alert(1)</script>\\n\\n[Piège](javascript:alert%281%29)',
    })));
  `], { cwd: process.cwd(), encoding: 'utf8' })
  expect(html).toContain('<strong')
  expect(html).toContain('>Chalet</strong>')
  expect(html).toContain('>terrasse</em>')
  expect(html).toContain('<ul')
  expect(html).toContain('href="https://example.com"')
  expect(html).not.toContain('<script')
  expect(html).not.toContain('javascript:')
})
