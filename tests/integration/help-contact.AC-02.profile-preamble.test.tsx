/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HelpContactDialog } from '@/features/contact-messages/components/HelpContactDialog'

function open(props: Parameters<typeof HelpContactDialog>[0] = {}) {
  render(<HelpContactDialog {...props} />)
  fireEvent.click(screen.getByRole('button', { name: props.label ?? 'Aide & contact' }))
  return screen.getByRole('dialog', { name: 'Nous écrire' })
}

describe('053 AC-02 — préambule par profil', () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ id: 'm1', status: 'received' }) })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('AC-02-01: opens on « Vous êtes… » with three profiles', () => {
    const dialog = open()
    expect(dialog).toHaveTextContent('Vous êtes…')
    for (const profile of ['Voyageur', 'Propriétaire', 'Entreprise']) {
      expect(within(dialog).getByRole('button', { name: new RegExp(profile) })).toBeInTheDocument()
    }
    expect(within(dialog).queryByRole('form')).not.toBeInTheDocument()
  })

  it('AC-02-02: sends a traveler message with the prefixed details', async () => {
    const dialog = open()
    fireEvent.click(within(dialog).getByRole('button', { name: /Voyageur/ }))
    const field = (name: RegExp) => within(dialog).getByLabelText(name)
    for (const [label, required] of [
      [/Prénom et nom/, true], [/Adresse e-mail/, true], [/Téléphone/, false], [/Logement concerné/, false],
      [/Dates souhaitées/, false], [/Nombre de voyageurs/, false], [/Votre message/, true],
    ] as const) {
      if (required) expect(field(label)).toBeRequired()
      else expect(field(label)).not.toBeRequired()
    }
    expect(field(/Votre message/)).toHaveAttribute('maxLength', '1650')
    fireEvent.change(field(/Prénom et nom/), { target: { value: 'Paul Durand' } })
    fireEvent.change(field(/Adresse e-mail/), { target: { value: 'paul@exemple.test' } })
    fireEvent.change(field(/Logement concerné/), { target: { value: 'Le 305' } })
    fireEvent.change(field(/Dates souhaitées/), { target: { value: 'Du 2 au 9 février' } })
    fireEvent.change(field(/Nombre de voyageurs/), { target: { value: '2' } })
    fireEvent.change(field(/Votre message/), { target: { value: 'Le parking est-il accessible avec un SUV ?' } })
    fireEvent.click(within(dialog).getByRole('checkbox'))
    fireEvent.submit(within(dialog).getByRole('form', { name: 'Message voyageur' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      source: 'help_contact',
      destination: 'concierge',
      lodging_id: null,
      sender_name: 'Paul Durand',
      sender_email: 'paul@exemple.test',
      sender_phone: null,
      subject: 'Aide & contact — Voyageur',
      message: 'Logement : Le 305\nDates souhaitées : Du 2 au 9 février\nVoyageurs : 2\nLe parking est-il accessible avec un SUV ?',
      website: '',
    })
  })

  it('AC-02-03: shows the existing owner and seminar forms', () => {
    const dialog = open()
    fireEvent.click(within(dialog).getByRole('button', { name: /Propriétaire/ }))
    expect(within(dialog).getByRole('button', { name: /Envoyer/ }).closest('form')).toHaveTextContent('Type de logement')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Changer de profil' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Entreprise/ }))
    expect(within(dialog).getByRole('form', { name: 'Demande séminaire' })).toBeInTheDocument()
  })

  it('AC-02-04: goes back to the preamble and resets it on close', () => {
    const dialog = open()
    fireEvent.click(within(dialog).getByRole('button', { name: /Voyageur/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Changer de profil' }))
    expect(dialog).toHaveTextContent('Vous êtes…')

    fireEvent.click(within(dialog).getByRole('button', { name: /Voyageur/ }))
    fireEvent.keyDown(dialog, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Aide & contact' }))
    expect(screen.getByRole('dialog', { name: 'Nous écrire' })).toHaveTextContent('Vous êtes…')
  })

  it('AC-02-05: traveler CTAs open the traveler form directly with the page lodgings', () => {
    const dialog = open({ label: 'Nous écrire', profile: 'traveler', lodgingOptions: ['Le 305', 'Le Chalet Hygge'] })
    expect(dialog).not.toHaveTextContent('Vous êtes…')
    expect(within(dialog).queryByRole('button', { name: 'Changer de profil' })).not.toBeInTheDocument()
    const select = within(dialog).getByLabelText(/Logement concerné/)
    expect(within(select).getAllByRole('option').map(option => option.textContent)).toEqual([
      'Pas encore choisi', 'Le 305', 'Le Chalet Hygge',
    ])
  })
})
