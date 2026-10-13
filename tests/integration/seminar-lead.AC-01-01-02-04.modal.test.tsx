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
  fireEvent.change(field(/Nombre de participants/), { target: { value: '18' } })
  fireEvent.change(field(/Nombre de nuits/), { target: { value: '2' } })
  fireEvent.change(field(/Dates souhaitées/), { target: { value: 'mars 2027' } })
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Salle de réunion' }))
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Repas' }))
  fireEvent.change(field(/Budget indicatif/), { target: { value: '15 000 € HT' } })
  fireEvent.change(field(/Votre projet/), { target: { value: 'Séminaire CODIR de deux jours.' } })
  fireEvent.click(within(dialog).getByRole('checkbox', { name: /J’accepte/ }))
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
    const dialog = screen.getByRole('dialog', { name: 'Demander un devis' })
    expect(dialog).toHaveTextContent('Saint-Gervais-les-Bains')
    // Amendement du 2026-10-13 : le devis porte toujours sur la location d'un chalet.
    expect(dialog).toHaveTextContent('location d’un chalet')

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-01-02: asks for the agreed fields with required markers and consent', () => {
    renderSeminar()
    fireEvent.click(screen.getAllByRole('button', { name: 'Parler de mon séminaire' })[0])
    const dialog = screen.getByRole('dialog')

    for (const [label, required] of [
      [/Prénom et nom/, true], [/Entreprise/, true], [/Adresse e-mail/, true], [/Téléphone/, false],
      [/Nombre de participants/, true], [/Nombre de nuits/, true], [/Dates souhaitées/, false],
      [/Budget indicatif/, false], [/Votre projet/, true],
    ] as const) {
      const input = within(dialog).getByLabelText(label)
      if (required) expect(input).toBeRequired()
      else expect(input).not.toBeRequired()
    }
    expect(within(dialog).getByLabelText(/Nombre de participants/)).toHaveAttribute('type', 'number')
    expect(within(dialog).getByLabelText(/Nombre de nuits/)).toHaveAttribute('type', 'number')
    const services = within(dialog).getByRole('group', { name: 'Prestations souhaitées' })
    const serviceBoxes = within(services).getAllByRole('checkbox')
    expect(serviceBoxes.map(box => (box as HTMLInputElement).value)).toEqual([
      'Salle de réunion', 'Repas', 'Transferts', 'Activités',
    ])
    for (const box of serviceBoxes) expect(box).not.toBeRequired()
    expect(within(dialog).getByRole('checkbox', { name: /J’accepte/ })).toBeRequired()
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
      message: 'Entreprise : Acme\nParticipants : 18\nNuits : 2\nDates souhaitées : mars 2027\nPrestations : Salle de réunion, Repas\nBudget indicatif : 15 000 € HT\n\nSéminaire CODIR de deux jours.',
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

  it('046 AC-02-04: the seminar landing shows the three formats, the concierge landing does not', () => {
    const seminar = renderSeminar()
    expect(screen.getByRole('heading', { level: 2, name: 'À chaque équipe son format.' })).toBeInTheDocument()
    const card = screen.getByRole('heading', { level: 3, name: 'Séminaire résidentiel' }).closest('article')!
    expect(within(card).getByRole('heading', { level: 4, name: 'Journée type' })).toBeInTheDocument()
    // Le devis d'une carte reprend la commune de la landing.
    fireEvent.click(within(card).getByRole('button', { name: 'Demander un devis' }))
    expect(screen.getByRole('dialog', { name: 'Demander un devis' })).toHaveTextContent('à Saint-Gervais-les-Bains')
    seminar.unmount()

    render(<LocalServiceLanding landing={publicLocalLanding('CONCIERGE', city)} />)
    expect(screen.queryByRole('heading', { name: 'À chaque équipe son format.' })).not.toBeInTheDocument()
  })

  it('BR-04: keeps the concierge landing CTA as a plain link', () => {
    render(<LocalServiceLanding landing={publicLocalLanding('CONCIERGE', city)} />)

    expect(screen.queryByRole('button', { name: 'Confier mon logement' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Confier mon logement/ })[0]).toHaveAttribute('href', '/confier-mon-logement')
  })

  it('separates the steps with inner lines only (no line above the first or below the last)', () => {
    renderSeminar()

    const steps = screen.getByRole('heading', { name: 'Une étape à Saint-Gervais-les-Bains' }).closest('ol')!
    expect(steps).toHaveClass('divide-y')
    expect(steps).not.toHaveClass('border-t')
    expect(steps.querySelector('li')).not.toHaveClass('border-b')
  })

  it('PO texts: seminar FAQ title and final call to action', () => {
    renderSeminar()

    expect(screen.getByRole('heading', { name: 'Vos questions, nos réponses.' })).toBeInTheDocument()
    // FAQ sur 2 colonnes à partir de md, titre au-dessus.
    expect(screen.getByTestId('marketing-faq-items')).toHaveClass('md:grid-cols-2', 'md:items-start')
    expect(screen.getByTestId('marketing-faq-section').firstElementChild).not.toHaveClass('lg:grid-cols-[0.75fr_1.25fr]')
    const finalHeading = screen.getByRole('heading', { name: 'Parlons de votre prochain séminaire.' })
    const finalBlock = finalHeading.closest('section')!
    expect(within(finalBlock).queryByRole('link', { name: 'Voir les logements' })).not.toBeInTheDocument()
    expect(within(finalBlock).queryByRole('link', { name: 'Tous les séminaires' })).not.toBeInTheDocument()
    expect(within(finalBlock).getByRole('link', { name: 'Découvrir la région' })).toHaveAttribute('href', '/decouvrir')
    expect(within(finalBlock).getByRole('button', { name: 'Parler de mon séminaire' }).closest('.lg\\:items-center')).not.toBeNull()
  })
})
