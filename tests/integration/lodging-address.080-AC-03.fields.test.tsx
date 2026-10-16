/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LodgingAddressFields } from '@/features/lodging-showcase/components/LodgingAddressFields'

const empty = { address_number: null, address_street: null, address_postal_code: null, address_city: null }

describe('080 AC-03-02 — saisie de l’adresse dans Caractéristiques', () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('pre-fills the city, saves the four parts and confirms', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
    render(<LodgingAddressFields lodgingId="lodging-1" initial={empty} defaultCity="Saint-Gervais-les-Bains" />)
    expect(screen.getByLabelText('Ville')).toHaveValue('Saint-Gervais-les-Bains')
    fireEvent.change(screen.getByLabelText('Numéro'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('Rue'), { target: { value: 'rue des Alpages' } })
    fireEvent.change(screen.getByLabelText('Code postal'), { target: { value: '74170' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’adresse' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Adresse enregistrée, le Guide est à jour.'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/dashboard/lodgings/lodging-1/address')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains' })
  })

  it('shows the API validation message', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: { code: 'INVALID_BODY', details: { issues: [{ message: 'Le code postal doit contenir 5 chiffres.' }] } } }) })
    render(<LodgingAddressFields lodgingId="lodging-1" initial={{ ...empty, address_postal_code: '7417' }} defaultCity="Saint-Gervais-les-Bains" />)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’adresse' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Le code postal doit contenir 5 chiffres.')
  })
})
