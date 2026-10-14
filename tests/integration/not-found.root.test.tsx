/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'

import NotFound, { metadata } from '@/app/not-found'

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// Spec 042, amendement 2026-10-10 : 404 illustrée et animée à la place de la 404 à liens.
describe('page 404 racine', () => {
  it('affiche les chiffres illustrés, le message en français et le retour à l’accueil', () => {
    mockReducedMotion(false)
    render(<NotFound />)

    expect(metadata.title).toBe('Page introuvable')
    expect(screen.getAllByRole('img').map(image => image.getAttribute('alt'))).toEqual(['4', '0', '4'])
    expect(screen.getByText(/Cette page s.est égarée\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Retour à l.accueil/ })).toHaveAttribute('href', '/')

    // Rejouer l'animation ne doit pas lever d'erreur.
    fireEvent.click(screen.getByRole('button', { name: "Rejouer l'animation" }))
  })

  it('rend le contenu visible sans animation quand le visiteur réduit les mouvements', () => {
    mockReducedMotion(true)
    render(<NotFound />)

    const link = screen.getByRole('link', { name: /Retour à l.accueil/ })
    expect(link.parentElement).toHaveStyle({ opacity: '1' })
    expect(screen.getByText(/Cette page s.est égarée\./)).toHaveStyle({ opacity: '1' })
  })
})
