/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

const mockListPublishedLocalLandingSummaries = jest.fn()

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn(async () => []),
}))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingSummaries: (...args: unknown[]) => mockListPublishedLocalLandingSummaries(...args),
}))

import LodgingsPage from '@/app/(public)/logements/page'
import SeminarsPage from '@/app/(public)/seminaires/page'
import OwnerContactPage from '@/app/(public)/confier-mon-logement/page'

// AC-04-04 (amendé le 2026-10-01) : les hubs ne portent plus de liens vers les
// pages locales dans leur contenu ; ces liens vivent dans le footer (AC-04-06).
describe('046 AC-04-04 — hubs without in-content local landing links', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    ['/logements', LodgingsPage],
    ['/seminaires', SeminarsPage],
    ['/confier-mon-logement', OwnerContactPage],
  ] as const)('%s renders no link to a local landing page and no destinations block', async (_path, Page) => {
    const { container } = render(await Page())

    const localLinks = Array.from(container.querySelectorAll('a[href]'))
      .map(link => link.getAttribute('href') ?? '')
      .filter(href => /^\/(conciergerie|seminaires|locations-vacances)\/./.test(href))
    expect(localLinks).toEqual([])
    expect(screen.queryByText('Retrouvez MyStay dans votre commune.')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid^="local-links-"]')).toBeNull()
    expect(mockListPublishedLocalLandingSummaries).not.toHaveBeenCalled()
  })
})

