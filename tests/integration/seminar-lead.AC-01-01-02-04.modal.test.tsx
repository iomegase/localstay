/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { LocalServiceLanding } from '@/features/local-seo/components/LocalServiceLanding'

const city = { id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }

function renderSeminar() {
  return render(<LocalServiceLanding landing={publicLocalLanding('SEMINAR', city)} />)
}

function fill(dialog: HTMLElement) {
  const field = (name: RegExp) => within(dialog).getByLabelText(name)
  fireEvent.change(field(/Prénom et nom/), { target: { value: 'Claire Martin' } })
  fireEvent.change(field(/Entreprise/), { target: { value: 'Acme' } })
  fireEvent.change(field(/Adresse e-mail/), { target: { value: 'claire@entreprise.test' } })
  fireEvent.change(field(/Téléphone/), { target: { value: '0611223344' } })
  fireEvent.change(field(/Nombre de participants/), { target: { value: '16 à 26' } })
  fireEvent.change(field(/Dates souhaitées/), { target: { value: 'mars 2027' } })
  fireEvent.change(field(/Votre projet/), { target: { value: 'Séminaire CODIR de deux jours.' } })
  fireEvent.click(within(dialog).getByRole('checkbox'))
}

describe('052 seminar lead modal', () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ id: 'm1', status: 'received' }) })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('AC-01-01: the seminar CTAs open an accessible modal instead of a mailto link', () => {
    renderSeminar()

    expect(screen.queryByRole('link', { name: 'Parler de mon séminaire' })).not.toBeInTheDocument()
    const ctas = screen.getAllByRole('button', { name: 'Parler de mon séminaire' })
    expect(ctas.length).toBeGreaterThanOrEqual(2)

    fireEvent.click(ctas[0])
    const dialog = screen.getByRole('dialog', { name: 'Recevoir une proposition' })
    expect(dialog).toHaveTextContent('Saint-Gervais-les-Bains')

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-01-02: asks for the agreed fields with required markers and consent', () => {
    renderSeminar()
    fireEvent.click(screen.getAllByRole('button', { name: 'Parler de mon séminaire' })[0])
    const dialog = screen.getByRole('dialog')

    for (const [label, required] of [
      [/Prénom et nom/, true], [/Entreprise/, true], [/Adresse e-mail/, true], [/Téléphone/, false],
      [/Nombre de participants/, true], [/Dates souhaitées/, false], [/Votre projet/, true],
    ] as const) {
      const input = within(dialog).getByLabelText(label)
      if (required) expect(input).toBeRequired()
      else expect(input).not.toBeRequired()
    }
    const participants = within(dialog).getByLabelText(/Nombre de participants/)
    expect(within(participants).getAllByRole('option').map(option => option.textContent)).toEqual([
      'Sélectionner', 'Moins de 10', '10 à 15', '16 à 26', 'Plus de 26',
    ])
    expect(within(dialog).getByRole('checkbox')).toBeRequired()
    expect(within(dialog).getByRole('button', { name: 'Envoyer ma demande' })).toBeInTheDocument()
  })

  it('AC-01-03/04: sends a seminar_lead to the contact API and confirms within 48h', async () => {
    renderSeminar()
    fireEvent.click(screen.getAllByRole('button', { name: 'Parler de mon séminaire' })[0])
    const dialog = screen.getByRole('dialog')
    fill(dialog)
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Envoyer ma demande' }).closest('form')!)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/public/contact-messages')
    expect(JSON.parse(init.body)).toEqual({
      source: 'seminar_lead',
      destination: 'concierge',
      lodging_id: null,
      sender_name: 'Claire Martin',
      sender_email: 'claire@entreprise.test',
      sender_phone: '0611223344',
      subject: 'Demande séminaire — Acme — Saint-Gervais-les-Bains',
      message: 'Entreprise : Acme\nParticipants : 16 à 26\nDates souhaitées : mars 2027\n\nSéminaire CODIR de deux jours.',
      website: '',
    })
    expect(await within(dialog).findByRole('status')).toHaveTextContent(
      'Merci. Votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.',
    )
  })

  it('AC-01-04: shows an error message when the request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
    renderSeminar()
    fireEvent.click(screen.getAllByRole('button', { name: 'Parler de mon séminaire' })[0])
    const dialog = screen.getByRole('dialog')
    fill(dialog)
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Envoyer ma demande' }).closest('form')!)

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Vérifiez les champs et réessayez')
  })

  it('BR-04: keeps the concierge landing CTA as a plain link', () => {
    render(<LocalServiceLanding landing={publicLocalLanding('CONCIERGE', city)} />)

    expect(screen.queryByRole('button', { name: 'Confier mon logement' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Confier mon logement/ })[0]).toHaveAttribute('href', '/confier-mon-logement')
  })

  it('PO texts: seminar FAQ title and final call to action', () => {
    renderSeminar()

    expect(screen.getByRole('heading', { name: 'Vos questions, nos réponses.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Parlons de votre prochain séminaire.' })).toBeInTheDocument()
  })
})
