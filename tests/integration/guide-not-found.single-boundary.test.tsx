/** @jest-environment jsdom */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import GuideNotFound from '@/app/(public)/guide/[city-slug]/not-found'

// 2026-10-05 : une seule 404 pour le guide privé (ville, catégorie, fiche,
// agenda…), au message neutre, à la place des deux 404 historiques.
describe('guide privé — 404 unique', () => {
  it('affiche un message neutre et ramène au guide du séjour', () => {
    render(<GuideNotFound />)

    expect(screen.getByRole('heading', { level: 1, name: 'Cette page du guide est introuvable.' })).toBeInTheDocument()
    expect(screen.queryByText(/en cours d.exploration/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour au guide' })).toHaveAttribute('href', '/sejour')
  })

  it('spec 054 AC-07-06 : masque l’ancien gabarit, et le retour recharge entièrement /sejour', () => {
    const { unmount } = render(<GuideNotFound />)

    expect(document.body).toHaveClass('immersive-screen')
    const link = screen.getByRole('link', { name: 'Retour au guide' })
    expect(link.tagName).toBe('A')
    expect(link).not.toHaveAttribute('data-next-link')
    unmount()
    expect(document.body).not.toHaveClass('immersive-screen')
  })

  it('ne conserve plus de 404 dédiée aux catégories', () => {
    const categoryNotFound = join(process.cwd(), 'src/app/(public)/guide/[city-slug]/[category-slug]/not-found.tsx')
    expect(existsSync(categoryNotFound)).toBe(false)
  })
})
