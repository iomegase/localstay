/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AdminGoogleReviews } from '@/features/google-reviews/components/AdminGoogleReviews'
import type { AdminGoogleReviewsData } from '@/features/google-reviews/types'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
const fetchMock = jest.fn()
const reply = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })

const SG = '0d1f6f9e-5a3c-4c47-8a1e-3a4b5c6d7e8f'
const SN = '1e2f3a4b-5c6d-4e7f-8a9b-0c1d2e3f4a5b'
const data = (overrides: Partial<AdminGoogleReviewsData> = {}): AdminGoogleReviewsData => ({
  configured: true,
  lastSyncedAt: '2026-10-05T05:45:00.000Z',
  destinations: [{ id: SG, name: 'Saint-Gervais-les-Bains' }, { id: SN, name: 'Saint-Nicolas-de-Véroce' }],
  reviews: [
    { id: 'r-old', google_review_id: 'g/old', author: 'Paul', author_photo_url: null, rating: 3, comment: 'Correct.', owner_reply: null, google_created_at: '2026-08-01T10:00:00.000Z', published_destination_ids: [] },
    { id: 'r-new', google_review_id: 'g/new', author: 'Julie', author_photo_url: null, rating: 5, comment: 'Parfait.', owner_reply: 'Merci Julie !', google_created_at: '2026-10-01T10:00:00.000Z', published_destination_ids: [SG] },
    { id: 'r-empty', google_review_id: 'g/empty', author: 'Léa', author_photo_url: null, rating: 4, comment: null, owner_reply: null, google_created_at: '2026-09-01T10:00:00.000Z', published_destination_ids: [] },
  ],
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
})

describe('062 AC-02-01 — liste admin', () => {
  it('lists reviews newest first with rating, text, owner reply and one checkbox per destination', () => {
    render(<AdminGoogleReviews initialData={data()} />)
    const cards = screen.getAllByRole('article')
    expect(cards.map(card => within(card).getByRole('heading').textContent)).toEqual(['Julie', 'Léa', 'Paul'])
    expect(within(cards[0]).getByLabelText('5 étoiles sur 5')).toBeInTheDocument()
    expect(within(cards[0]).getByText('Merci Julie !')).toBeInTheDocument()
    expect(within(cards[0]).getByRole('checkbox', { name: 'Publié sur Saint-Gervais-les-Bains' })).toBeChecked()
    expect(within(cards[0]).getByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })).not.toBeChecked()
  })

  it('filters by rating', () => {
    render(<AdminGoogleReviews initialData={data()} />)
    fireEvent.click(screen.getByRole('button', { name: '5★' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '3★ et moins' }))
    expect(within(screen.getByRole('article')).getByRole('heading')).toHaveTextContent('Paul')
    fireEvent.click(screen.getByRole('button', { name: 'Toutes' }))
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('AC-02-02 shows « Note sans commentaire » and disables publication for reviews without text', () => {
    render(<AdminGoogleReviews initialData={data()} />)
    const lea = screen.getAllByRole('article')[1]
    expect(within(lea).getByText('Note sans commentaire')).toBeInTheDocument()
    within(lea).getAllByRole('checkbox').forEach(checkbox => expect(checkbox).toBeDisabled())
  })

  it('sends the full set of checked destinations when a box changes', async () => {
    reply({ google_review_id: 'g/new', published_destination_ids: [SG, SN] })
    render(<AdminGoogleReviews initialData={data()} />)
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })[0])
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/google-reviews/r-new/publications', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ destination_ids: [SG, SN] }),
    })))
    await waitFor(() => expect(screen.getAllByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })[0]).toBeChecked())
  })

  it('restores the previous state and shows the error when publication fails', async () => {
    reply({ error: { code: 'DESTINATION_NOT_FOUND', message: 'Destination indisponible.', details: {} } }, 404)
    render(<AdminGoogleReviews initialData={data()} />)
    const box = screen.getAllByRole('checkbox', { name: 'Publié sur Saint-Nicolas-de-Véroce' })[0]
    fireEvent.click(box)
    expect(await screen.findByRole('status')).toHaveTextContent('Destination indisponible.')
    expect(box).not.toBeChecked()
  })
})

describe('062 AC-02-05 — synchro manuelle et états', () => {
  it('runs the sync, shows the summary and refreshes the page', async () => {
    reply({ fetched: 12, created: 2, updated: 1, deleted: 0 })
    render(<AdminGoogleReviews initialData={data()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Synchroniser maintenant' }))
    expect(await screen.findByRole('status')).toHaveTextContent('12 avis lus · 2 nouveaux · 1 mis à jour · 0 retiré')
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/google-reviews/sync', { method: 'POST' })
    expect(refresh).toHaveBeenCalled()
  })

  it('shows the empty state', () => {
    render(<AdminGoogleReviews initialData={data({ reviews: [] })} />)
    expect(screen.getByText('Aucun avis importé. Lancez une synchronisation.')).toBeInTheDocument()
  })

  it('shows the not-configured banner and disables the sync button', () => {
    render(<AdminGoogleReviews initialData={data({ configured: false })} />)
    expect(screen.getByText('Connexion Google non configurée')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Synchroniser maintenant' })).toBeDisabled()
  })
})
