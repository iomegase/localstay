/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { MarkdownHint } from '@/shared/components/MarkdownHint'

describe('MarkdownHint — aide de mise en forme owner/admin', () => {
  it('renders a collapsible help block listing the supported markdown rules', () => {
    render(<MarkdownHint />)

    // Titre du bloc (résumé dépliable)
    expect(screen.getByText(/mise en forme/i)).toBeInTheDocument()

    // Les règles essentielles sont expliquées
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/gras/i)
    expect(text).toMatch(/italique/i)
    expect(text).toMatch(/titre/i)
    expect(text).toMatch(/liste/i)
    expect(text).toMatch(/lien/i)
  })
})
