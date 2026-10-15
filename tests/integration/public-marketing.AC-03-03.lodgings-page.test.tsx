/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn(async () => []),
}))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingSummaries: jest.fn(async () => []),
}))

import LodgingsPage from '@/app/(public)/logements/page'

describe('031-public-marketing-site global lodgings page', () => {
  it('renders an editorial empty state when no published profile exists', async () => {
    render(await LodgingsPage())

    expect(screen.getByRole('heading', { level: 1, name: 'Des lieux suivis avec attention.' })).toBeInTheDocument()
    expect(screen.getByText(/Aucun logement public n’est encore disponible/i)).toBeInTheDocument()
  })

  it('AC-01-16: puts « avec attention. » on its own serif italic 34px line', async () => {
    render(await LodgingsPage())
    const serif = screen.getByRole('heading', { level: 1 }).querySelector('.font-serif')
    expect(serif).toHaveTextContent('avec attention.')
    expect(serif).toHaveClass('block', 'italic', 'text-[34px]')
  })
})
