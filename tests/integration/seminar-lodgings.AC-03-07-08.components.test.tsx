/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeminarSelectionButton } from '@/features/lodging-showcase/components/SeminarSelectionButton'
import { SeminarLodgings } from '@/features/lodging-showcase/components/SeminarLodgings'
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn() })
it('adds, refreshes and renders the remove action from the updated server state', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  const { rerender } = render(<SeminarSelectionButton lodgingId="lodging" selected={false} />)
  await userEvent.click(screen.getByRole('button', { name: 'Ajouter à la page Séminaires' }))
  expect(fetch).toHaveBeenCalledWith('/api/admin/lodgings/lodging/seminar-selection', expect.objectContaining({ method: 'PATCH', body: '{"seminar_selected":true}' }))
  expect(mockRefresh).toHaveBeenCalledTimes(1)
  rerender(<SeminarSelectionButton lodgingId="lodging" selected />)
  expect(screen.getByText('Sélectionné pour les séminaires')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Retirer de la page Séminaires' }))
  expect(fetch).toHaveBeenLastCalledWith('/api/admin/lodgings/lodging/seminar-selection', expect.objectContaining({ body: '{"seminar_selected":false}' }))
})
it.each(['http', 'network'])('preserves selection on %s failure', async failure => {
  if (failure === 'http') (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
  else (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  render(<SeminarSelectionButton lodgingId="lodging" selected />)
  await userEvent.click(screen.getByRole('button', { name: 'Retirer de la page Séminaires' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible d’enregistrer')
  expect(screen.getByRole('button', { name: 'Retirer de la page Séminaires' })).toBeEnabled()
  expect(mockRefresh).not.toHaveBeenCalled()
})
it('disables duplicate submissions while saving', async () => {
  let resolve!: (value: { ok: boolean }) => void
  ;(global.fetch as jest.Mock).mockReturnValue(new Promise(r => { resolve = r }))
  render(<SeminarSelectionButton lodgingId="lodging" selected={false} />)
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('button', { name: 'Enregistrement…' })).toBeDisabled()
  resolve({ ok: true })
  await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
})
it('omits an empty selection entirely', () => {
  const { container } = render(<SeminarLodgings lodgings={[]} />)
  expect(container).toBeEmptyDOMElement()
})
it('renders public title, city, photo and canonical lodging link', () => {
  render(<SeminarLodgings lodgings={[{ id: 'p1', title: 'T2 cosy', cityName: 'Saint-Gervais', href: '/logements/t2-cosy', photo: { url: '/cover.jpg', alt: 'Salon du logement' } }]} />)
  expect(screen.getByRole('heading', { name: 'Nos logements pour vos séminaires' })).toBeVisible()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/logements/t2-cosy')
  expect(screen.getByRole('img')).toHaveAttribute('alt', 'Salon du logement')
  expect(screen.getByText('Saint-Gervais')).toBeVisible()
})
