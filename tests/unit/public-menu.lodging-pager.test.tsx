/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn()
})

describe('LodgingPager', () => {
  function renderPager() {
    return render(
      <LodgingPager titles={['Infos pratiques', 'À découvrir']}>
        <div>PANEL ONE</div>
        <div>PANEL TWO</div>
      </LodgingPager>,
    )
  }

  it('renders only the active panel, the active title and two pagination dots (first active)', () => {
    renderPager()
    expect(screen.getByText('PANEL ONE')).toBeInTheDocument()
    expect(screen.queryByText('PANEL TWO')).not.toBeInTheDocument()
    expect(screen.getByText('Infos pratiques')).toBeInTheDocument()
    const dots = screen.getAllByRole('button', { name: /aller à/i })
    expect(dots).toHaveLength(2)
    expect(dots[0]).toHaveAttribute('aria-current', 'true')
    expect(dots[1]).toHaveAttribute('aria-current', 'false')
  })

  it('switches to the second panel when its dot is tapped', async () => {
    const user = userEvent.setup()
    renderPager()
    await user.click(screen.getByRole('button', { name: /aller à à découvrir/i }))
    expect(screen.queryByText('PANEL ONE')).not.toBeInTheDocument()
    expect(screen.getByText('PANEL TWO')).toBeInTheDocument()
    expect(screen.getByText('À découvrir')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /aller à/i })[1]).toHaveAttribute('aria-current', 'true')
  })

  it('keeps the active page height content-driven with controlled bottom padding', () => {
    const { container } = renderPager()
    expect(container.firstElementChild).toHaveClass('pb-6')
    expect(screen.getByTestId('lodging-pager-panel')).toHaveClass('w-full')
    expect(screen.getByTestId('lodging-pager-panel').className).not.toContain('min-h')
  })
})
