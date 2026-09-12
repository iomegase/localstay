/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AdminLandingPages } from '@/features/local-seo/components/AdminLandingPages'
import type { AdminLandingDestinationDto } from '@/features/local-seo/types/landing-pages'
import { LOCAL_LANDING_INTENTS } from '@/features/local-seo/types/landing-pages'
import { landingPageInput } from '../fixtures/local-landing-management'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

export function destination(overrides: Partial<AdminLandingDestinationDto> = {}): AdminLandingDestinationDto {
  return {
    id: '7a3fffcf-6f71-4fbb-916a-12a052d43b81', city: { id: 'city-1', name: 'Megève', slug: 'megeve' },
    is_active: true, pages: LOCAL_LANDING_INTENTS.map(landingPageInput),
    publication: { concierge: true, seminar: true, vacationRental: false },
    contentIssues: [], publicLodgingCount: 0, reviewCount: 0, reviews: [],
    created_at: '2026-09-08T12:00:00.000Z', updated_at: '2026-09-08T12:00:00.000Z', ...overrides,
  }
}

const fetchMock = jest.fn()
function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })
}
function setup(row = destination()) {
  render(<AdminLandingPages initialDestinations={[row]} eligibleCities={[{ id: 'city-2', name: 'Combloux', slug: 'combloux' }]} />)
  return within(screen.getByRole('table', { name: 'Landings par ville' }))
}

beforeEach(() => { jest.clearAllMocks(); global.fetch = fetchMock; Element.prototype.scrollIntoView = jest.fn() })

describe('048 admin landing management', () => {
  it('AC-01 renders grouped statuses, controls and responsive structures', () => {
    const table = setup()
    expect(table.getByRole('switch', { name: 'Archiver Megève' })).toBeChecked()
    expect(table.getByRole('button', { name: 'Modifier Megève' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Supprimer les landings de Megève' })).toBeVisible()
    expect(table.getByText('Aucun logement associé')).toBeVisible()
    expect(screen.getByTestId('landing-mobile-cards')).toHaveClass('md:table-row-group')
    expect(screen.getByRole('table')).toHaveClass('block', 'md:table')
    expect(screen.getAllByRole('button', { name: 'Modifier Megève' })).toHaveLength(1)
  })

  it('AC-03 opens three accordions and submits all pages with repeatable edits', async () => {
    const row = destination()
    const table = setup(row)
    fireEvent.click(table.getByRole('button', { name: 'Modifier Megève' }))
    expect(screen.getAllByRole('form', { name: 'Contenus de Megève' })).toHaveLength(1)
    const editor = within(screen.getByRole('form', { name: 'Contenus de Megève' }))
    for (const name of ['Conciergerie', 'Séminaires', 'Locations de vacances']) expect(editor.getByRole('button', { name, exact: true })).toBeVisible()
    fireEvent.click(editor.getByRole('button', { name: 'Conciergerie', exact: true }))
    for (const label of [
      'Titre SEO', 'Description SEO', 'Surtitre', 'H1', 'Titre du bandeau', 'Texte du bandeau',
      'Réassurance', 'Titre de section', 'Texte de section', 'Titre des étapes', 'Titre local',
      'Texte local', 'Libellé du CTA', 'Lien du CTA', 'Texte sans logement',
    ]) expect(editor.getByLabelText(label)).toBeVisible()
    fireEvent.change(editor.getByLabelText('H1'), { target: { value: 'Votre projet à Megève' } })
    fireEvent.click(editor.getByRole('button', { name: 'Ajouter un point fort' }))
    fireEvent.change(editor.getByLabelText('Point fort 2 — Titre'), { target: { value: 'Service local' } })
    fireEvent.change(editor.getByLabelText('Point fort 2 — Texte'), { target: { value: 'Une équipe disponible.' } })
    editor.getByLabelText('Point fort 2 — Titre').focus()
    fireEvent.click(editor.getByRole('button', { name: 'Supprimer le point fort 1' }))
    expect(editor.getByLabelText('Point fort 1 — Titre')).toHaveFocus()
    fireEvent.click(editor.getByRole('button', { name: 'Ajouter une étape' }))
    fireEvent.change(editor.getByLabelText('Étape 2 — Titre'), { target: { value: 'Confirmation' } })
    fireEvent.change(editor.getByLabelText('Étape 2 — Texte'), { target: { value: 'Nous confirmons les détails.' } })
    fireEvent.click(editor.getByRole('button', { name: 'Supprimer l’étape 1' }))
    fireEvent.click(editor.getByRole('button', { name: 'Ajouter une FAQ' }))
    fireEvent.change(editor.getByLabelText('FAQ 2 — Question'), { target: { value: 'Quand confirmer ?' } })
    fireEvent.change(editor.getByLabelText('FAQ 2 — Réponse'), { target: { value: 'Après validation des détails.' } })
    fireEvent.click(editor.getByRole('button', { name: 'Supprimer la FAQ 1' }))
    fireEvent.click(editor.getByRole('button', { name: 'Séminaires', exact: true }))
    fireEvent.click(editor.getByRole('button', { name: 'Conciergerie', exact: true }))
    expect(editor.getByLabelText('H1')).toHaveValue('Votre projet à Megève')
    expect(editor.getByLabelText('Point fort 1 — Titre')).toHaveValue('Service local')
    response(row)
    fireEvent.click(editor.getByRole('button', { name: 'Enregistrer les trois pages' }))
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(request.pages).toHaveLength(3)
    expect(request.pages[0]).toMatchObject({
      h1: 'Votre projet à Megève',
      highlights: [{ title: 'Service local', copy: 'Une équipe disponible.' }],
      steps: [{ title: 'Confirmation', copy: 'Nous confirmons les détails.' }],
      faq: [{ question: 'Quand confirmer ?', answer: 'Après validation des détails.' }],
    })
    expect(screen.getByRole('status')).toHaveTextContent('Contenus enregistrés')
  })

  it('AC-04 rolls back optimistic activation and announces missing fields', async () => {
    const table = setup(destination({ is_active: false }))
    let resolve: (value: unknown) => void = () => undefined
    fetchMock.mockReturnValueOnce(new Promise(value => { resolve = value }))
    fireEvent.click(table.getByRole('switch', { name: 'Activer Megève' }))
    expect(table.getByRole('switch', { name: 'Archiver Megève' })).toBeChecked()
    expect(table.getByRole('button', { name: 'Modifier Megève' })).toBeDisabled()
    expect(table.getByRole('button', { name: 'Supprimer les landings de Megève' })).toBeDisabled()
    resolve({ ok: false, status: 400, json: async () => ({ error: { code: 'INCOMPLETE_CONTENT', message: 'Complétez les contenus.', details: { CONCIERGE: ['h1'] } } }) })
    await waitFor(() => expect(table.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked())
    expect(screen.getByRole('alert')).toHaveTextContent('Complétez les contenus.')
    expect(screen.getByRole('alert')).toHaveTextContent('CONCIERGE')
    expect(screen.getByRole('alert')).toHaveTextContent('h1')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('AC-03 preserves edits and enables retry after an API or network failure', async () => {
    const table = setup()
    fireEvent.click(table.getByRole('button', { name: 'Modifier Megève' }))
    const editor = within(screen.getByRole('form', { name: 'Contenus de Megève' }))
    fireEvent.click(editor.getByRole('button', { name: 'Conciergerie', exact: true }))
    fireEvent.change(editor.getByLabelText('H1'), { target: { value: 'Texte conservé' } })
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(editor.getByRole('button', { name: 'Enregistrer les trois pages' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion impossible'))
    expect(editor.getByLabelText('H1')).toHaveValue('Texte conservé')
    expect(editor.getByRole('button', { name: 'Enregistrer les trois pages' })).toBeEnabled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('AC-02 adds an eligible existing City and opens its three-page editor', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ville' }))
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Ville existante' }), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Combloux' }))
    const added = destination({ id: 'destination-2', city: { id: 'city-2', name: 'Combloux', slug: 'combloux' }, is_active: false })
    response(added, 201)
    fireEvent.click(screen.getByRole('button', { name: 'Créer les landings' }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Modifier Combloux' })).toHaveLength(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/landing-pages', expect.objectContaining({ method: 'POST', body: JSON.stringify({ city_id: 'city-2' }) }))
    expect(screen.getByRole('button', { name: 'Ajouter une ville' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Ville ajoutée. Complétez les pages Conciergerie et Séminaires avant activation.')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('AC-05 confirms deletion, removes the destination and associated review editor', async () => {
    const table = setup()
    fireEvent.click(table.getByRole('button', { name: 'Modifier Megève' }))
    fireEvent.click(table.getByRole('button', { name: 'Supprimer les landings de Megève' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Les logements, POI, articles, guides et la ville sont conservés.')
    let resolve: (value: unknown) => void = () => undefined
    fetchMock.mockReturnValueOnce(new Promise(value => { resolve = value }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Supprimer les landings' }))
    const dialog = within(screen.getByRole('alertdialog'))
    expect(dialog.getByRole('button', { name: 'Supprimer les landings' })).toBeDisabled()
    expect(dialog.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(screen.queryByRole('table', { name: 'Landings par ville' })).not.toBeInTheDocument()
    resolve({ ok: true, status: 200, json: async () => ({ id: destination().id }) })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Modifier Megève' })).not.toBeInTheDocument())
    expect(screen.queryByLabelText('Auteur')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/landing-pages/${destination().id}`, expect.objectContaining({ method: 'DELETE' }))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('AC-04 updates publication statuses from the successful API response', async () => {
    const table = setup()
    response(destination({ is_active: false, publication: { concierge: false, seminar: false, vacationRental: false } }))
    fireEvent.click(table.getByRole('switch', { name: 'Archiver Megève' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Landings archivées.'))
    expect(table.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked()
    expect(table.getAllByText('Non publiée')).toHaveLength(2)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('AC-05 clears an unrelated publication error when opening the delete dialog', async () => {
    const table = setup(destination({ is_active: false }))
    response({ error: { code: 'INCOMPLETE_CONTENT', message: 'Complétez les contenus.', details: {} } }, 400)
    fireEvent.click(table.getByRole('switch', { name: 'Activer Megève' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Complétez les contenus.'))
    fireEvent.click(table.getByRole('button', { name: 'Supprimer les landings de Megève' }))
    expect(within(screen.getByRole('alertdialog')).queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Complétez les contenus.')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('AC-05 preserves a failed deletion and allows retry inside the dialog', async () => {
    const table = setup()
    fireEvent.click(table.getByRole('button', { name: 'Supprimer les landings de Megève' }))
    response({ error: { code: 'INTERNAL_ERROR', message: 'Suppression impossible.', details: {} } }, 500)
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Supprimer les landings' }))
    const dialog = within(screen.getByRole('alertdialog'))
    await waitFor(() => expect(dialog.getByRole('alert')).toHaveTextContent('Suppression impossible.'))
    expect(dialog.getByRole('button', { name: 'Supprimer les landings' })).toBeEnabled()
    fireEvent.click(dialog.getByRole('button', { name: 'Annuler' }))
    expect(table.getByRole('button', { name: 'Modifier Megève' })).toBeVisible()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('rejects malformed successful API responses without refreshing or corrupting UI state', async () => {
    const table = setup(destination({ is_active: false }))
    response({ id: destination().id })
    fireEvent.click(table.getByRole('switch', { name: 'Activer Megève' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Réponse serveur invalide'))
    expect(table.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked()
    expect(table.getByRole('button', { name: 'Modifier Megève' })).toBeEnabled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('AC-03 retains the editor draft when refreshed server props update reviews', () => {
    const row = destination()
    const { rerender } = render(<AdminLandingPages initialDestinations={[row]} eligibleCities={[]} />)
    const table = within(screen.getByRole('table'))
    fireEvent.click(table.getByRole('button', { name: 'Modifier Megève' }))
    const editor = within(screen.getByRole('form', { name: 'Contenus de Megève' }))
    fireEvent.click(editor.getByRole('button', { name: 'Conciergerie', exact: true }))
    fireEvent.change(editor.getByLabelText('H1'), { target: { value: 'Mon brouillon conservé' } })
    rerender(<AdminLandingPages initialDestinations={[{ ...row, reviewCount: 2 }]} eligibleCities={[]} />)
    expect(editor.getByLabelText('H1')).toHaveValue('Mon brouillon conservé')
    expect(table.getByText('2')).toBeVisible()
  })

  it('AC-03 mounts one editor immediately after its selected destination and before the next city', () => {
    const megeve = destination()
    const combloux = destination({ id: 'destination-2', city: { id: 'city-2', name: 'Combloux', slug: 'combloux' } })
    render(<AdminLandingPages initialDestinations={[megeve, combloux]} eligibleCities={[]} />)
    const editButton = screen.getAllByRole('button', { name: 'Modifier Megève' })[0]
    fireEvent.click(editButton)
    const editors = screen.getAllByRole('form', { name: 'Contenus de Megève' })
    expect(editors).toHaveLength(1)
    const editorRow = editors[0].closest('tr')
    expect(editorRow).not.toBeNull()
    expect(editorRow?.previousElementSibling).toHaveTextContent('Megève')
    expect(editorRow?.nextElementSibling).toHaveTextContent('Combloux')
    const region = screen.getByRole('region', { name: 'Modifier les landings de Megève' })
    expect(editButton).toHaveAttribute('aria-controls', region.id)
  })
})
