/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'

jest.mock('next/navigation', () => ({ usePathname: () => '/page-inexistante' }))

import NotFound, { metadata } from '@/app/not-found'

// Audit SEO/GEO 2026-10-05 : page 404 MyStay en français à la place de la 404 Next par défaut.
describe('page 404 racine', () => {
  it('affiche un message en français, le logo MyStay et des liens utiles', () => {
    render(<NotFound />)

    expect(metadata.title).toBe('Page introuvable')
    expect(screen.getByRole('heading', { level: 1, name: 'Cette page est introuvable.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'MyStay — Accueil' })).toHaveAttribute('href', '/')

    const links = within(screen.getByTestId('not-found-links'))
    expect(links.getByRole('link', { name: /Accueil/ })).toHaveAttribute('href', '/')
    expect(links.getByRole('link', { name: /Nos logements/ })).toHaveAttribute('href', '/logements')
    expect(links.getByRole('link', { name: /Découvrir/ })).toHaveAttribute('href', '/decouvrir')
    expect(links.getByRole('link', { name: /Journal/ })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: 'Nous contacter' })).toHaveAttribute('href', '/confier-mon-logement')
  })
})
