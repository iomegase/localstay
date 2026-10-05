import { execFileSync } from 'node:child_process'

it('AC-08-02 renders article and lodging headings without changing legacy consumers', () => {
  const html = execFileSync(process.execPath, ['--import', 'tsx', '-e', `
    const React = require('react'); global.React = React;
    const { renderToStaticMarkup } = require('react-dom/server');
    const { BlogMarkdown } = require('./src/features/blog/components/BlogMarkdown.tsx');
    const { MarkdownText } = require('./src/shared/components/MarkdownText.tsx');
    const source = '## Section\\n\\n### Sous-section\\n\\n#### Détail';
    console.log(JSON.stringify([
      renderToStaticMarkup(React.createElement(BlogMarkdown, { source })),
      renderToStaticMarkup(React.createElement(MarkdownText, { source, headingLevel: 3 })),
      renderToStaticMarkup(React.createElement(MarkdownText, { source })),
    ]));
  `], { encoding: 'utf8' })
  const [article, lodging, legacy] = JSON.parse(html) as string[]
  expect(article.match(/<h[1-6]\b/g)).toEqual(['<h2', '<h3', '<h4'])
  expect(lodging.match(/<h[1-6]\b/g)).toEqual(['<h3', '<h4', '<h5'])
  expect(legacy.match(/<h[1-6]\b/g)).toEqual(['<h4', '<h5', '<h4'])
})
