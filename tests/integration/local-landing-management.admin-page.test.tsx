/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AdminLandingPages } from '@/features/local-seo/components/AdminLandingPages'
import { adminLandingDestination } from '../fixtures/local-landing-management'

const refresh = jest.fn()
const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push, replace: jest.fn() }) }))

const destination = adminLandingDestination

const fetchMock = jest.fn()
function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })
}
function setup(row = destination()) {
  render(<AdminLandingPages initialDestinations={[row]} eligibleCities={[{ id: 'city-2', name: 'Combloux', slug: 'combloux' }]} />)
  return within(screen.getByRole('list', { name: 'Landings par ville' }))
}

beforeEach(() => { jest.clearAllMocks(); global.fetch = fetchMock; Element.prototype.scrollIntoView = jest.fn() })

// Spec 048 (gestion) sur l'interface 076 (liste + page par ville).
describe('048 / 076 admin landing list', () => {
  it('AC-01 / 076 AC-01-01 : une ligne par ville, pastilles, interrupteur, modifier et supprimer', () => {
    const list = setup()
    expect(list.getByRole('switch', { name: 'Archiver Megève' })).toBeChecked()
    expect(list.getByRole('link', { name: 'Modifier Megève' })).toHaveAttribute('href', '/admin/landing-pages/megeve')
    expect(list.getByRole('button', { name: 'Supprimer les landings de Megève' })).toBeVisible()
    expect(list.getByRole('link', { name: 'Conciergerie : Publiée' })).toBeVisible()
    expect(list.getByRole('link', { name: 'Séminaires : Publiée' })).toBeVisible()
    expect(list.getByRole('link', { name: 'Locations de vacances : Aucun logement' })).toBeVisible()
    expect(screen.queryByLabelText('Auteur')).not.toBeInTheDocument()
  })

  it('076 AC-01-02 : une pastille ouvre la page de la ville sur son onglet', () => {
    const list = setup(destination({ publicLodgingCount: 2 }))
    expect(list.getByRole('link', { name: 'Séminaires : Publiée' })).toHaveAttribute('href', '/admin/landing-pages/megeve?onglet=seminaires')
    expect(list.getByRole('link', { name: 'Locations de vacances : Non publiée' })).toHaveAttribute('href', '/admin/landing-pages/megeve?onglet=locations')
  })

  it('076 AC-02-05 : nombre de champs à compléter sur la pastille', () => {
    const list = setup(destination({ contentIssues: [{ intent: 'SEMINAR', field: 'h1', message: 'x' }, { intent: 'SEMINAR', field: 'cta_href', message: 'x' }] }))
    expect(within(list.getByRole('link', { name: /^Séminaires/ })).getByTitle('Champs à compléter')).toHaveTextContent('2')
  })

  it('AC-04 rolls back optimistic activation and announces missing fields', async () => {
    const list = setup(destination({ is_active: false }))
    let resolve: (value: unknown) => void = () => undefined
    fetchMock.mockReturnValueOnce(new Promise(value => { resolve = value }))
    fireEvent.click(list.getByRole('switch', { name: 'Activer Megève' }))
    expect(list.getByRole('switch', { name: 'Archiver Megève' })).toBeChecked()
    expect(list.getByRole('button', { name: 'Supprimer les landings de Megève' })).toBeDisabled()
    resolve({ ok: false, status: 400, json: async () => ({ error: { code: 'INCOMPLETE_CONTENT', message: 'Complétez les contenus.', details: { CONCIERGE: ['h1'] } } }) })
    await waitFor(() => expect(list.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked())
    expect(screen.getByRole('alert')).toHaveTextContent('Complétez les contenus.')
    expect(screen.getByRole('alert')).toHaveTextContent('CONCIERGE')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('AC-04 updates publication statuses from the successful API response', async () => {
    const list = setup()
    response(destination({ is_active: false, publication: { concierge: false, seminar: false, vacationRental: false } }))
    fireEvent.click(list.getByRole('switch', { name: 'Archiver Megève' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Landings archivées.'))
    expect(list.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked()
    expect(list.getAllByText('Non publiée')).toHaveLength(2)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed successful API responses without refreshing or corrupting UI state', async () => {
    const list = setup(destination({ is_active: false }))
    response({ id: destination().id })
    fireEvent.click(list.getByRole('switch', { name: 'Activer Megève' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Réponse serveur invalide'))
    expect(list.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('AC-02 / 076 AC-01-03 : ajoute une ville puis ouvre sa page d’édition', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ville' }))
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Ville existante' }), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Combloux' }))
    response(destination({ id: 'destination-2', city: { id: 'city-2', name: 'Combloux', slug: 'combloux' }, is_active: false }), 201)
    fireEvent.click(screen.getByRole('button', { name: 'Créer les landings' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/landing-pages/combloux'))
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/landing-pages', expect.objectContaining({ method: 'POST', body: JSON.stringify({ city_id: 'city-2' }) }))
  })

  it('AC-05 confirms deletion and removes the destination', async () => {
    const list = setup()
    fireEvent.click(list.getByRole('button', { name: 'Supprimer les landings de Megève' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Les logements, POI, articles, guides et la ville sont conservés.')
    let resolve: (value: unknown) => void = () => undefined
    fetchMock.mockReturnValueOnce(new Promise(value => { resolve = value }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Supprimer les landings' }))
    const dialog = within(screen.getByRole('alertdialog'))
    expect(dialog.getByRole('button', { name: 'Supprimer les landings' })).toBeDisabled()
    expect(dialog.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    resolve({ ok: true, status: 200, json: async () => ({ id: destination().id }) })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Modifier Megève' })).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/landing-pages/${destination().id}`, expect.objectContaining({ method: 'DELETE' }))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('AC-05 clears an unrelated publication error when opening the delete dialog', async () => {
    const list = setup(destination({ is_active: false }))
    response({ error: { code: 'INCOMPLETE_CONTENT', message: 'Complétez les contenus.', details: {} } }, 400)
    fireEvent.click(list.getByRole('switch', { name: 'Activer Megève' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Complétez les contenus.'))
    fireEvent.click(list.getByRole('button', { name: 'Supprimer les landings de Megève' }))
    expect(within(screen.getByRole('alertdialog')).queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Complétez les contenus.')).not.toBeInTheDocument()
  })

  it('AC-05 preserves a failed deletion and allows retry inside the dialog', async () => {
    const list = setup()
    fireEvent.click(list.getByRole('button', { name: 'Supprimer les landings de Megève' }))
    response({ error: { code: 'INTERNAL_ERROR', message: 'Suppression impossible.', details: {} } }, 500)
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Supprimer les landings' }))
    const dialog = within(screen.getByRole('alertdialog'))
    await waitFor(() => expect(dialog.getByRole('alert')).toHaveTextContent('Suppression impossible.'))
    expect(dialog.getByRole('button', { name: 'Supprimer les landings' })).toBeEnabled()
    fireEvent.click(dialog.getByRole('button', { name: 'Annuler' }))
    expect(list.getByRole('link', { name: 'Modifier Megève' })).toBeVisible()
    expect(refresh).not.toHaveBeenCalled()
  })
})
