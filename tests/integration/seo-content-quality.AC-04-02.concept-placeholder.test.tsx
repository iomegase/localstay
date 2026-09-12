/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import ConceptPage from '@/app/(public)/concept/page'

describe('043 /concept editorial placeholder removal', () => {
  it('keeps every approved principle heading without placeholder or empty paragraph', () => {
    render(<ConceptPage />)

    expect(screen.queryByText(/description des principes/i)).not.toBeInTheDocument()

    for (const principle of [
      'Une présence locale et identifiable',
      'Les bonnes informations au bon moment',
      'Un logement suivi dans la durée',
    ]) {
      const heading = screen.getByRole('heading', { name: principle })
      expect(heading).toBeInTheDocument()
      const description = heading.parentElement?.querySelector('p')
      expect(description).not.toBeEmptyDOMElement()
      expect(description).not.toHaveTextContent(/description des principes|lorem ipsum|placeholder/i)
    }
  })
})
