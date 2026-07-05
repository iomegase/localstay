/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteUserButton } from '@/features/admin/components/DeleteUserButton'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

describe('DeleteUserButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as unknown) = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(true)
  })

  it('renders nothing for admin accounts', () => {
    const { container } = render(
      <DeleteUserButton userId="u-1" email="a@b.c" role="admin" lodgingCount={0} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('calls the DELETE endpoint after confirmation and refreshes', async () => {
    render(<DeleteUserButton userId="u-1" email="a@b.c" role="owner" lodgingCount={2} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/u-1', { method: 'DELETE' }),
    )
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('does not call the endpoint when confirmation is cancelled', () => {
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(false)
    render(<DeleteUserButton userId="u-1" email="a@b.c" role="owner" lodgingCount={2} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
