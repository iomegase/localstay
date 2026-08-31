/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import ConceptPage from '@/app/(public)/concept/page'

describe('043 /concept editorial placeholder removal', () => {
  it('keeps every approved principle heading without placeholder or empty paragraph', () => {
    render(<ConceptPage />)

    expect(screen.queryByText(/description des principes/i)).not.toBeInTheDocument()

    for (const principle of [
      'Une présence locale et identifiable',
      'Des besoins anticipés avec justesse',
      'Chaque logement valorisé durablement',
    ]) {
      const heading = screen.getByRole('heading', { name: principle })
      expect(heading).toBeInTheDocument()
      expect(heading.parentElement?.querySelector('p')).toBeNull()
      expect(heading.parentElement).not.toBeEmptyDOMElement()
    }
  })
})
