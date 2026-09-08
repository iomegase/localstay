/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OwnerLeadForm } from '@/features/contact-messages/components/OwnerLeadForm'

describe('031 AC-04-03 owner lead form', () => {
  it('submits to the public API and renders the exact success message', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    Object.defineProperty(global, 'fetch', { value: fetchMock, configurable: true })
    render(<OwnerLeadForm />)

    fireEvent.change(screen.getByLabelText('Prénom et nom *'), { target: { value: 'Marie Dupont' } })
    fireEvent.change(screen.getByLabelText('Adresse e-mail *'), { target: { value: 'marie@example.test' } })
    fireEvent.change(screen.getByLabelText('Commune du logement *'), { target: { value: 'Saint-Nicolas-de-Véroce' } })
    fireEvent.change(screen.getByLabelText('Type de logement *'), { target: { value: 'Chalet' } })
    fireEvent.change(screen.getByLabelText('Parlez-nous de votre projet *'), { target: { value: 'Je souhaite déléguer la gestion de mon chalet.' } })
    fireEvent.click(screen.getByLabelText(/J’accepte/))
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma demande' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/public/contact-messages', expect.objectContaining({ method: 'POST' })))
    expect(await screen.findByRole('status')).toHaveTextContent('Merci. Votre demande a bien été envoyée. Nous vous recontacterons personnellement.')
  })
})
