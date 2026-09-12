/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AdminLandingPages } from '@/features/local-seo/components/AdminLandingPages'
import type { AdminLandingDestinationDto } from '@/features/local-seo/types/landing-pages'
import { LOCAL_LANDING_INTENTS } from '@/features/local-seo/types/landing-pages'
import { landingPageInput } from '../fixtures/local-landing-management'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const fetchMock = jest.fn()

function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
})

describe('047 landing pages admin UI', () => {
  it('lists configured cities and keeps reviews associated with the selected city', () => {
    const rows: AdminLandingDestinationDto[] = ['Megève', 'Combloux'].map((name, index) => ({
      id: `destination-${index}`, city: { id: `city-${index}`, name, slug: index === 0 ? 'megeve' : 'combloux' },
      is_active: true, pages: LOCAL_LANDING_INTENTS.map(landingPageInput),
      publication: { concierge: true, seminar: true, vacationRental: false },
      contentIssues: [], publicLodgingCount: 0, reviewCount: 0, reviews: [],
      created_at: '2026-09-08T12:00:00.000Z', updated_at: '2026-09-08T12:00:00.000Z',
    }))
    render(<AdminLandingPages initialDestinations={rows} eligibleCities={[]} />)
    expect(screen.getByRole('heading', { name: 'Landing pages' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Avis de Megève' })).toBeInTheDocument()
    expect(screen.getByLabelText('Auteur')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publier l’avis' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: 'Auteur à Megève' } })
    fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'Modifier Combloux' }))
    expect(screen.getByRole('heading', { name: 'Avis de Combloux' })).toBeInTheDocument()
    expect(screen.getByLabelText('Auteur')).toHaveValue('')
  })

  it('restores review controls and reports a network failure without refreshing', async () => {
    const row: AdminLandingDestinationDto = {
      id: 'destination-1', city: { id: 'city-1', name: 'Megève', slug: 'megeve' },
      is_active: true, pages: LOCAL_LANDING_INTENTS.map(landingPageInput),
      publication: { concierge: true, seminar: true, vacationRental: false },
      contentIssues: [], publicLodgingCount: 0, reviewCount: 0, reviews: [],
      created_at: '2026-09-08T12:00:00.000Z', updated_at: '2026-09-08T12:00:00.000Z',
    }
    render(<AdminLandingPages initialDestinations={[row]} eligibleCities={[]} />)
    const table = within(screen.getByRole('table', { name: 'Landings par ville' }))
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: 'Marie' } })
    fireEvent.change(screen.getByLabelText('Avis'), { target: { value: 'Un séjour parfaitement accompagné par MyStay.' } })
    let reject: (reason: Error) => void = () => undefined
    fetchMock.mockReturnValueOnce(new Promise((_, rejectPromise) => { reject = rejectPromise }))
    fireEvent.click(screen.getByRole('button', { name: 'Publier l’avis' }))
    expect(table.getByRole('button', { name: 'Modifier Megève' })).toBeDisabled()
    expect(table.getByRole('switch', { name: 'Archiver Megève' })).toBeDisabled()
    reject(new Error('offline'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Connexion impossible'))
    expect(screen.getByRole('button', { name: 'Publier l’avis' })).toBeEnabled()
    expect(screen.getByLabelText('Auteur')).toHaveValue('Marie')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('rejects a malformed successful review response without clearing the draft or refreshing', async () => {
    const row: AdminLandingDestinationDto = {
      id: 'destination-1', city: { id: 'city-1', name: 'Megève', slug: 'megeve' },
      is_active: true, pages: LOCAL_LANDING_INTENTS.map(landingPageInput),
      publication: { concierge: true, seminar: true, vacationRental: false },
      contentIssues: [], publicLodgingCount: 0, reviewCount: 0, reviews: [],
      created_at: '2026-09-08T12:00:00.000Z', updated_at: '2026-09-08T12:00:00.000Z',
    }
    render(<AdminLandingPages initialDestinations={[row]} eligibleCities={[]} />)
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: 'Marie' } })
    fireEvent.change(screen.getByLabelText('Avis'), { target: { value: 'Un séjour parfaitement accompagné par MyStay.' } })
    response({ id: 'review-1' }, 201)
    fireEvent.click(screen.getByRole('button', { name: 'Publier l’avis' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Réponse serveur invalide'))
    expect(screen.getByLabelText('Auteur')).toHaveValue('Marie')
    expect(screen.getByLabelText('Avis')).toHaveValue('Un séjour parfaitement accompagné par MyStay.')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('rejects a malformed successful archive response without refreshing', async () => {
    const row: AdminLandingDestinationDto = {
      id: 'destination-1', city: { id: 'city-1', name: 'Megève', slug: 'megeve' },
      is_active: true, pages: LOCAL_LANDING_INTENTS.map(landingPageInput),
      publication: { concierge: true, seminar: true, vacationRental: false },
      contentIssues: [], publicLodgingCount: 0, reviewCount: 1,
      reviews: [{
        id: 'review-1', destination_id: 'destination-1', destination_slug: 'megeve', author: 'Marie',
        quote: 'Un séjour parfaitement accompagné par MyStay.', stay_date: null, source: 'DIRECT', rating: 5,
        sort_order: 0, is_active: true, deleted_with_destination: false, deleted_at: null,
        created_at: '2026-09-08T12:00:00.000Z', updated_at: '2026-09-08T12:00:00.000Z',
      }],
      created_at: '2026-09-08T12:00:00.000Z', updated_at: '2026-09-08T12:00:00.000Z',
    }
    render(<AdminLandingPages initialDestinations={[row]} eligibleCities={[]} />)
    response({ id: 'review-1' })
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Réponse serveur invalide'))
    expect(screen.getByText('Marie')).toBeVisible()
    expect(refresh).not.toHaveBeenCalled()
  })
})
