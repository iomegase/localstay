/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'

function openDialog() {
  render(<MarketingFooter />)
  fireEvent.click(screen.getByRole('button', { name: 'Aide & contact' }))
  const dialog = screen.getByRole('dialog', { name: 'Nous écrire' })
  // Amendement 053 AC-02 : le préambule précède le formulaire.
  fireEvent.click(within(dialog).getByRole('button', { name: /Voyageur/ }))
  return dialog
}

function fill(dialog: HTMLElement) {
  const field = (name: RegExp) => within(dialog).getByLabelText(name)
  fireEvent.change(field(/Prénom et nom/), { target: { value: 'Paul Durand' } })
  fireEvent.change(field(/Adresse e-mail/), { target: { value: 'paul@exemple.test' } })
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

  // AC-01-02 (menu « Vous êtes ») remplacé par le préambule AC-02 : voir help-contact.AC-02.profile-preamble.test.tsx.

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
