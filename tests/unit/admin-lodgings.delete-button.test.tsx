/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteLodgingButton } from '@/features/admin/components/DeleteLodgingButton'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

describe('DeleteLodgingButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as unknown) = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(true)
  })

  it('calls the DELETE endpoint after confirmation and refreshes', async () => {
    render(<DeleteLodgingButton lodgingId="l-1" name="Le 305" />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/lodgings/l-1', { method: 'DELETE' }),
    )
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('does nothing when confirmation is cancelled', () => {
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(false)
    render(<DeleteLodgingButton lodgingId="l-1" name="Le 305" />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
