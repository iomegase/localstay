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

  it('031 AC-07-01 presents the title, David inset and owner form in order', async () => {
    const { container } = render(await OwnerContactPage())
    const title = screen.getByRole('heading', { level: 1 })
    const inset = screen.getByRole('region', { name: 'Un accompagnement local, une relation directe.' })
    const formTitle = screen.getByRole('heading', { name: 'Confier mon logement à MyStay' })

    expect(inset).toHaveTextContent('Je suis David Devillers')
    expect(title.compareDocumentPosition(inset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(inset.compareDocumentPosition(formTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelector('form')).toBeInTheDocument()
    expect(screen.queryByText('Nous découvrons votre logement')).not.toBeInTheDocument()
    expect(screen.queryByText('Nous définissons vos priorités')).not.toBeInTheDocument()
    expect(screen.queryByText('Nous organisons la mise en gestion')).not.toBeInTheDocument()
  })

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

jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({ listSeminarLodgings: jest.fn().mockResolvedValue([]) }))
