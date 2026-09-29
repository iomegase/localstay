import { normalizeBlogMarkdown } from '@/features/blog/lib/markdown'
import { BlogArticleUpsertSchema } from '@/features/blog/schemas'

describe('029 blog Markdown line breaks', () => {
  it('recovers paragraphs, headings and lists from literal escaped newlines', () => {
    const source = String.raw`Introduction.\n\n### La Ferme d’Ernestine\nUne adresse locale.\n\n- Premier conseil\n- Second conseil`
    expect(normalizeBlogMarkdown(source)).toBe('Introduction.\n\n### La Ferme d’Ernestine\nUne adresse locale.\n\n- Premier conseil\n- Second conseil')
  })

  it('normalizes escaped CRLF and leaves normal Markdown unchanged', () => {
    const expected = '## Titre\n\nContenu.'
    expect(normalizeBlogMarkdown(String.raw`## Titre\r\n\r\nContenu.`)).toBe(expected)
    expect(normalizeBlogMarkdown(expected)).toBe(expected)
    expect(normalizeBlogMarkdown(expected.replace(/\n/g, '\r\n'))).toBe(expected)
  })

  it('preserves inline code and fenced examples containing literal escapes', () => {
    const source = String.raw`Un exemple : ` + '`String.raw`' + String.raw`.\n\nLe code ` + '`' + String.raw`\n` + '`' + String.raw` reste intact.\n\n` + '```js\nconst value = "\\n";\n```'
    const actual = normalizeBlogMarkdown(source)
    expect(actual).toContain('`\\n`')
    expect(actual).toContain('```js\nconst value = "\\n";\n```')
    expect(actual).toContain('intact.\n\n')
    expect(normalizeBlogMarkdown(actual)).toBe(actual)
  })

  it('preserves literal escapes in already valid multiline prose and doubled backslashes', () => {
    const source = '## Syntaxe\n\nLa séquence \\n est expliquée ici.'
    expect(normalizeBlogMarkdown(source)).toBe(source)
    expect(normalizeBlogMarkdown(String.raw`Chemin C:\\notes`)).toBe(String.raw`Chemin C:\\notes`)
  })

  it('normalizes the saved article payload through Zod', () => {
    const parsed = BlogArticleUpsertSchema.parse({ category: 'restaurants', content_markdown: String.raw`## Restaurant\n\nTexte.` })
    expect(parsed.content_markdown).toBe('## Restaurant\n\nTexte.')
  })
})
