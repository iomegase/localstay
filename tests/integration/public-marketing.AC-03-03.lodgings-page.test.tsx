/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn(async () => []),
}))

import LodgingsPage from '@/app/(public)/logements/page'

describe('031-public-marketing-site global lodgings page', () => {
  it('renders an editorial empty state when no published profile exists', async () => {
    render(await LodgingsPage())

    expect(screen.getByRole('heading', { level: 1, name: /Des séjours choisis/i })).toBeInTheDocument()
    expect(screen.getByText(/Aucun logement public n’est encore disponible/i)).toBeInTheDocument()
  })
})
