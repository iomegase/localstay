/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AdminLandingCityEditor } from '@/features/local-seo/components/AdminLandingCityEditor'
import { adminLandingDestination as destination } from '../fixtures/local-landing-management'

const refresh = jest.fn()
const replace = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, replace, push: jest.fn() }) }))

const fetchMock = jest.fn()
function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })
}

beforeEach(() => { jest.clearAllMocks(); global.fetch = fetchMock })

const panel = () => within(screen.getByRole('tabpanel'))

// Spec 076 US-02 — page d'édition d'une ville.
describe('076 — page ville', () => {
  it('AC-02-01 : retour, interrupteur, onglets ; l’onglet est reporté dans l’URL', () => {
    render(<AdminLandingCityEditor destination={destination({ reviewCount: 3 })} initialTab="conciergerie" />)
    expect(screen.getByRole('link', { name: /Landing pages/ })).toHaveAttribute('href', '/admin/landing-pages')
    expect(screen.getByRole('switch', { name: 'Archiver Megève' })).toBeChecked()
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Conciergerie', 'Séminaires', 'Locations de vacances', 'Avis(3)'])
    expect(screen.getByRole('tab', { name: 'Conciergerie' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Séminaires' }))
    expect(replace).toHaveBeenCalledWith('?onglet=seminaires', { scroll: false })
    expect(screen.getByRole('tab', { name: 'Séminaires' })).toHaveAttribute('aria-selected', 'true')
  })

  it('AC-02-02 : champs regroupés en blocs ; « Texte sans logement » seulement en Locations', () => {
    render(<AdminLandingCityEditor destination={destination()} initialTab="conciergerie" />)
    for (const block of ['Référencement', 'Bandeau', 'Section principale', 'Étapes', 'Ancrage local', 'Appel à l’action', 'FAQ']) {
      expect(panel().getByRole('heading', { name: block })).toBeVisible()
    }
    expect(panel().queryByLabelText('Texte sans logement')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Locations de vacances' }))
    expect(panel().getByLabelText('Texte sans logement')).toHaveValue('Aucun logement public n’est encore disponible.')
  })

  it('AC-02-03 : compteur SEO et aperçu Google suivent la saisie', () => {
    render(<AdminLandingCityEditor destination={destination()} initialTab="conciergerie" />)
    fireEvent.change(panel().getByLabelText('Titre SEO'), { target: { value: 'x'.repeat(70) } })
    expect(screen.getByTestId('counter-seo_title')).toHaveTextContent('70 / 60')
    expect(screen.getByTestId('counter-seo_title')).toHaveClass('text-amber-600')
    const preview = within(screen.getByLabelText('Aperçu Google'))
    expect(preview.getByText('www.mystay.city/conciergerie/megeve')).toBeVisible()
    expect(preview.getByText('x'.repeat(70))).toBeVisible()
  })

  it('AC-02-04 : « Voir la page » ouvre la page publique de l’onglet', () => {
    render(<AdminLandingCityEditor destination={destination()} initialTab="seminaires" />)
    const link = screen.getByRole('link', { name: /Voir la page/ })
    expect(link).toHaveAttribute('href', '/seminaires/megeve')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('AC-02-05 : champs à compléter signalés, compteur sur l’onglet', () => {
    render(<AdminLandingCityEditor destination={destination({ contentIssues: [
      { intent: 'CONCIERGE', field: 'h1', message: 'String must contain at least 3 character(s)' },
      { intent: 'CONCIERGE', field: 'faq.0.answer', message: 'Required' },
    ] })} initialTab="conciergerie" />)
    expect(within(screen.getByRole('tab', { name: /Conciergerie/ })).getByTitle('Champs à compléter')).toHaveTextContent('2')
    expect(panel().getByLabelText('Titre principal (H1)')).toHaveAttribute('aria-invalid', 'true')
    expect(panel().getByLabelText('Question 1 — Réponse')).toHaveAttribute('aria-invalid', 'true')
    expect(panel().getAllByText('À compléter')).toHaveLength(2)
  })

  it('AC-02-06 / BR-02 : barre fixe, annulation, enregistrement des trois pages avec éléments répétables', async () => {
    const row = destination()
    render(<AdminLandingCityEditor destination={row} initialTab="conciergerie" />)
    expect(screen.queryByRole('region', { name: 'Enregistrement' })).not.toBeInTheDocument()

    fireEvent.change(panel().getByLabelText('Titre principal (H1)'), { target: { value: 'Brouillon' } })
    const bar = within(screen.getByRole('region', { name: 'Enregistrement' }))
    expect(bar.getByText('Modifications non enregistrées')).toBeVisible()
    fireEvent.click(bar.getByRole('button', { name: 'Annuler' }))
    expect(panel().getByLabelText('Titre principal (H1)')).toHaveValue('Préparer votre séjour à Megève')
    expect(screen.queryByRole('region', { name: 'Enregistrement' })).not.toBeInTheDocument()

    fireEvent.change(panel().getByLabelText('Titre principal (H1)'), { target: { value: 'Votre projet à Megève' } })
    fireEvent.click(panel().getByRole('button', { name: 'Ajouter un point fort' }))
    fireEvent.change(panel().getByLabelText('Point fort 2 — Titre'), { target: { value: 'Service local' } })
    fireEvent.change(panel().getByLabelText('Point fort 2 — Texte'), { target: { value: 'Une équipe disponible.' } })
    panel().getByLabelText('Point fort 2 — Titre').focus()
    fireEvent.click(panel().getByRole('button', { name: 'Supprimer point fort 1' }))
    expect(panel().getByLabelText('Point fort 1 — Titre')).toHaveFocus()
    fireEvent.click(panel().getByRole('button', { name: 'Ajouter une question' }))
    fireEvent.change(panel().getByLabelText('Question 2 — Question'), { target: { value: 'Quand confirmer ?' } })
    fireEvent.change(panel().getByLabelText('Question 2 — Réponse'), { target: { value: 'Après validation des détails.' } })
    fireEvent.click(panel().getByRole('button', { name: 'Supprimer question 1' }))

    // Le brouillon survit au changement d'onglet.
    fireEvent.click(screen.getByRole('tab', { name: 'Séminaires' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Conciergerie' }))
    expect(panel().getByLabelText('Titre principal (H1)')).toHaveValue('Votre projet à Megève')

    response(row)
    fireEvent.click(within(screen.getByRole('region', { name: 'Enregistrement' })).getByRole('button', { name: 'Enregistrer les trois pages' }))
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/admin/landing-pages/${row.id}`)
    expect(request.pages).toHaveLength(3)
    expect(request.pages[0]).toMatchObject({
      h1: 'Votre projet à Megève',
      highlights: [{ title: 'Service local', copy: 'Une équipe disponible.' }],
      faq: [{ question: 'Quand confirmer ?', answer: 'Après validation des détails.' }],
    })
    expect(screen.getByRole('status')).toHaveTextContent('Contenus enregistrés')
  })

  it('AC-02-06 : échec réseau → brouillon conservé, nouvel essai possible', async () => {
    render(<AdminLandingCityEditor destination={destination()} initialTab="conciergerie" />)
    fireEvent.change(panel().getByLabelText('Titre principal (H1)'), { target: { value: 'Texte conservé' } })
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les trois pages' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion impossible'))
    expect(panel().getByLabelText('Titre principal (H1)')).toHaveValue('Texte conservé')
    expect(screen.getByRole('button', { name: 'Enregistrer les trois pages' })).toBeEnabled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('AC-02-06 : quitter avec des modifications demande confirmation', () => {
    render(<AdminLandingCityEditor destination={destination()} initialTab="conciergerie" />)
    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)
    fireEvent.change(panel().getByLabelText('Titre principal (H1)'), { target: { value: 'Brouillon' } })
    const dirty = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirty)
    expect(dirty.defaultPrevented).toBe(true)
  })

  it('le brouillon survit au rafraîchissement serveur (ex. avis ajouté)', () => {
    const row = destination()
    const { rerender } = render(<AdminLandingCityEditor destination={row} initialTab="conciergerie" />)
    fireEvent.change(panel().getByLabelText('Titre principal (H1)'), { target: { value: 'Mon brouillon conservé' } })
    rerender(<AdminLandingCityEditor destination={{ ...row, reviewCount: 2 }} initialTab="conciergerie" />)
    expect(panel().getByLabelText('Titre principal (H1)')).toHaveValue('Mon brouillon conservé')
    expect(screen.getByRole('tab', { name: /Avis/ })).toHaveTextContent('(2)')
  })

  it('activation refusée : retour arrière et détail des champs', async () => {
    render(<AdminLandingCityEditor destination={destination({ is_active: false })} initialTab="conciergerie" />)
    response({ error: { code: 'INCOMPLETE_CONTENT', message: 'Complétez les contenus.', details: { CONCIERGE: ['h1'] } } }, 400)
    fireEvent.click(screen.getByRole('switch', { name: 'Activer Megève' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Complétez les contenus.'))
    expect(screen.getByRole('switch', { name: 'Activer Megève' })).not.toBeChecked()
  })
})
