/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LodgingInquiryDialog } from '@/features/contact-messages/components/LodgingInquiryDialog'
import { OwnerLeadDialog } from '@/features/contact-messages/components/OwnerLeadDialog'

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ id: 'm-1', status: 'received' }) })
  global.fetch = fetchMock as unknown as typeof fetch
})

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('028 amendement 2026-10-05 — modales de contact de la fiche logement', () => {
  it('AC-03-02: le formulaire voyageur s’ouvre en modale et désigne le logement par son slug', async () => {
    render(
      <LodgingInquiryDialog
        lodgingSlug="chalet-hygge"
        lodgingTitle="Chalet Hygge"
        analyticsCitySlug="saint-gervais-les-bains"
        analyticsLodgingId="profile-1"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Contacter' }))
    expect(screen.getByRole('dialog', { name: 'Chalet Hygge' })).toBeInTheDocument()

    fill(/Prénom et nom/, 'Paul Durand')
    fill(/Adresse e-mail/, 'paul@exemple.test')
    fill(/Dates souhaitées/, 'du 14 au 21 février')
    fill(/Votre message/, 'Bonjour, le chalet est-il disponible ?')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma demande' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/public/contact-messages')
    const payload = JSON.parse(init.body)
    expect(payload).toEqual(expect.objectContaining({
      source: 'lodging_inquiry',
      destination: 'concierge',
      lodging_slug: 'chalet-hygge',
      subject: 'Demande logement — Chalet Hygge',
    }))
    expect(payload).not.toHaveProperty('lodging_id')
    expect(payload.message).toContain('Dates souhaitées : du 14 au 21 février')
    expect(await screen.findByRole('status')).toHaveTextContent('Votre demande a bien été envoyée')
  })

  it('AC-03-02: le formulaire propriétaire s’ouvre en modale', () => {
    render(<OwnerLeadDialog />)

    fireEvent.click(screen.getByRole('button', { name: 'Confier mon logement' }))
    expect(screen.getByRole('dialog', { name: 'Confier mon logement' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Demande propriétaire' })).toBeInTheDocument()
  })
})
