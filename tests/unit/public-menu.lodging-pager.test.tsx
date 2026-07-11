/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
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

  function renderFourPagePager() {
    return render(
      <LodgingPager titles={['Bienvenue', 'Infos pratiques', 'Bon à savoir', 'Départ']}>
        <div>PAGE ONE</div>
        <div>PAGE TWO</div>
        <div>PAGE THREE</div>
        <div>PAGE FOUR</div>
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

  it('switches pages with a horizontal swipe gesture', () => {
    renderPager()
    const carousel = screen.getByRole('group', { name: /navigation du guide logement/i })

    fireEvent.touchStart(carousel, { touches: [{ clientX: 280, clientY: 120 }] })
    fireEvent.touchMove(carousel, { touches: [{ clientX: 120, clientY: 126 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 120, clientY: 126 }] })

    expect(screen.queryByText('PANEL ONE')).not.toBeInTheDocument()
    expect(screen.getByText('PANEL TWO')).toBeInTheDocument()

    fireEvent.touchStart(carousel, { touches: [{ clientX: 120, clientY: 120 }] })
    fireEvent.touchMove(carousel, { touches: [{ clientX: 280, clientY: 126 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 280, clientY: 126 }] })

    expect(screen.getByText('PANEL ONE')).toBeInTheDocument()
    expect(screen.queryByText('PANEL TWO')).not.toBeInTheDocument()
  })

  it('can reach the fourth page with a continuous touch gesture', () => {
    renderFourPagePager()
    const carousel = screen.getByRole('group', { name: /navigation du guide logement/i })

    fireEvent.touchStart(carousel, { touches: [{ clientX: 360, clientY: 120 }] })
    fireEvent.touchMove(carousel, { touches: [{ clientX: 270, clientY: 124 }] })
    fireEvent.touchMove(carousel, { touches: [{ clientX: 180, clientY: 124 }] })
    fireEvent.touchMove(carousel, { touches: [{ clientX: 90, clientY: 124 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 90, clientY: 124 }] })

    expect(screen.queryByText('PAGE ONE')).not.toBeInTheDocument()
    expect(screen.queryByText('PAGE TWO')).not.toBeInTheDocument()
    expect(screen.queryByText('PAGE THREE')).not.toBeInTheDocument()
    expect(screen.getByText('PAGE FOUR')).toBeInTheDocument()
  })

  it('switches pages with a horizontal trackpad wheel gesture', () => {
    renderPager()
    const carousel = screen.getByRole('group', { name: /navigation du guide logement/i })

    fireEvent.wheel(carousel, { deltaX: 120, deltaY: 8 })

    expect(screen.queryByText('PANEL ONE')).not.toBeInTheDocument()
    expect(screen.getByText('PANEL TWO')).toBeInTheDocument()
  })

  it('can reach the fourth page with continuous horizontal trackpad movement', () => {
    renderFourPagePager()
    const carousel = screen.getByRole('group', { name: /navigation du guide logement/i })

    fireEvent.wheel(carousel, { deltaX: 90, deltaY: 4 })
    fireEvent.wheel(carousel, { deltaX: 90, deltaY: 4 })
    fireEvent.wheel(carousel, { deltaX: 90, deltaY: 4 })

    expect(screen.queryByText('PAGE ONE')).not.toBeInTheDocument()
    expect(screen.queryByText('PAGE TWO')).not.toBeInTheDocument()
    expect(screen.queryByText('PAGE THREE')).not.toBeInTheDocument()
    expect(screen.getByText('PAGE FOUR')).toBeInTheDocument()
  })

  it('ignores mostly vertical wheel gestures so normal scrolling still works', () => {
    renderPager()
    const carousel = screen.getByRole('group', { name: /navigation du guide logement/i })

    fireEvent.wheel(carousel, { deltaX: 18, deltaY: 120 })

    expect(screen.getByText('PANEL ONE')).toBeInTheDocument()
    expect(screen.queryByText('PANEL TWO')).not.toBeInTheDocument()
  })

  it('ignores mostly vertical gestures so page scroll remains natural', () => {
    renderPager()
    const carousel = screen.getByRole('group', { name: /navigation du guide logement/i })

    fireEvent.touchStart(carousel, { touches: [{ clientX: 250, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 200, clientY: 230 }] })

    expect(screen.getByText('PANEL ONE')).toBeInTheDocument()
    expect(screen.queryByText('PANEL TWO')).not.toBeInTheDocument()
  })

  it('keeps the active page height content-driven with controlled bottom padding', () => {
    const { container } = renderPager()
    expect(container.firstElementChild).toHaveClass('pb-6')
    expect(screen.getByTestId('lodging-pager-panel')).toHaveClass('w-full')
    expect(screen.getByTestId('lodging-pager-panel').className).not.toContain('min-h')
  })
})
