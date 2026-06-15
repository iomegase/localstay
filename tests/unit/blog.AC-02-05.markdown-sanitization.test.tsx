/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { BlogMarkdown } from '@/features/blog/components/BlogMarkdown'

describe('029 blog markdown sanitization', () => {
  it('drops raw HTML and unsafe javascript links from the public article body', () => {
    render(
      <BlogMarkdown
        source={`# Titre\n\n<script>alert("x")</script>\n\n<a href="https://bad.test">raw html</a>\n\n[Lire plus](javascript:alert('x'))`}
      />,
    )

    expect(screen.getByText(/# Titre/)).toBeInTheDocument()
    expect(screen.queryByText('raw html')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Lire plus' })).not.toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })
})
