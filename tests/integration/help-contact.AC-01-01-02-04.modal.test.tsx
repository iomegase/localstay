/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'

function openDialog() {
  render(<MarketingFooter />)
  fireEvent.click(screen.getByRole('button', { name: 'Aide & contact' }))
  return screen.getByRole('dialog', { name: 'Nous écrire' })
}

function fill(dialog: HTMLElement) {
  const field = (name: RegExp) => within(dialog).getByLabelText(name)
  fireEvent.change(field(/Prénom et nom/), { target: { value: 'Paul Durand' } })
  fireEvent.change(field(/Adresse e-mail/), { target: { value: 'paul@exemple.test' } })
  fireEvent.change(field(/Vous êtes/), { target: { value: 'Voyageur' } })
  fireEvent.change(field(/Votre message/), { target: { value: 'Bonjour, je cherche le lien de mon guide de séjour.' } })
  fireEvent.click(within(dialog).getByRole('checkbox'))
}

describe('053 help contact modal', () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ id: 'm1', status: 'received' }) })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('AC-01-01: « Aide & contact » opens an accessible modal instead of navigating', () => {
    render(<MarketingFooter />)

    expect(screen.queryByRole('link', { name: 'Aide & contact' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aide & contact' }))
    const dialog = screen.getByRole('dialog', { name: 'Nous écrire' })
    expect(within(dialog).getByRole('button', { name: 'Fermer' })).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-01-02: asks for the agreed fields with required markers and consent', () => {
    const dialog = openDialog()

    for (const [label, required] of [
      [/Prénom et nom/, true], [/Adresse e-mail/, true], [/Téléphone/, false], [/Vous êtes/, true], [/Votre message/, true],
    ] as const) {
      const input = within(dialog).getByLabelText(label)
      if (required) expect(input).toBeRequired()
      else expect(input).not.toBeRequired()
    }
    const profile = within(dialog).getByLabelText(/Vous êtes/)
    expect(within(profile).getAllByRole('option').map(option => option.textContent)).toEqual([
      'Sélectionner', 'Voyageur', 'Propriétaire', 'Entreprise', 'Autre',
    ])
    expect(within(dialog).getByRole('checkbox')).toBeRequired()
    expect(dialog).toHaveTextContent('J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.')
    expect(within(dialog).getByRole('button', { name: 'Envoyer mon message' })).toBeInTheDocument()
  })

  it('AC-01-03/04: sends a help_contact message and confirms', async () => {
    const dialog = openDialog()
    fill(dialog)
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Envoyer mon message' }).closest('form')!)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/public/contact-messages')
    expect(JSON.parse(init.body)).toEqual({
      source: 'help_contact',
      destination: 'concierge',
      lodging_id: null,
      sender_name: 'Paul Durand',
      sender_email: 'paul@exemple.test',
      sender_phone: null,
      subject: 'Aide & contact — Voyageur',
      message: 'Bonjour, je cherche le lien de mon guide de séjour.',
      website: '',
    })
    expect(await within(dialog).findByRole('status')).toHaveTextContent(
      'Merci. Votre message a bien été envoyé. Nous vous répondons au plus vite.',
    )
  })

  it('AC-01-04: shows an error message when the request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
    const dialog = openDialog()
    fill(dialog)
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Envoyer mon message' }).closest('form')!)

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Vérifiez les champs et réessayez')
  })
})
