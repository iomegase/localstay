import { execFileSync } from 'node:child_process'

it('AC-08-05 renders "##Retour" (no space after the hashes) as a heading, but leaves "#hashtag" as text', () => {
  const html = execFileSync(process.execPath, ['--import', 'tsx', '-e', `
    const React = require('react'); global.React = React;
    const { renderToStaticMarkup } = require('react-dom/server');
    const { MarkdownText } = require('./src/shared/components/MarkdownText.tsx');
    const source = '## Montée\\nTexte de montée.\\n##Retour\\nTexte de retour.\\n#hashtag en début de ligne';
    console.log(renderToStaticMarkup(React.createElement(MarkdownText, { source, breaks: true })));
  `], { encoding: 'utf8' })

  expect(html.match(/<h[1-6][^>]*>[^<]*<\/h[1-6]>/g)?.map(tag => tag.replace(/<[^>]+>/g, ''))).toEqual(['Montée', 'Retour'])
  expect(html).toContain('#hashtag en début de ligne')
  expect(html).not.toContain('##Retour')
})
