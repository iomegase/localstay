/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PoiBackButton } from '@/features/categories/components/PoiBackButton'

describe('PoiBackButton', () => {
  it('renders a labelled close/back control', () => {
    render(<PoiBackButton />)
    expect(screen.getByRole('button', { name: /fermer/i })).toBeInTheDocument()
  })

  it('goes back in browser history on click when there is history', async () => {
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true })
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => {})

    render(<PoiBackButton />)
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))

    expect(back).toHaveBeenCalledTimes(1)
    back.mockRestore()
  })

  it('falls back to the stay home when there is no history', async () => {
    Object.defineProperty(window.history, 'length', { value: 1, configurable: true })
    const assign = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { assign },
      configurable: true,
      writable: true,
    })

    render(<PoiBackButton />)
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))

    expect(assign).toHaveBeenCalledWith('/')
  })
})
