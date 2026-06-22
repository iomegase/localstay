/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'

beforeAll(() => {
  // jsdom n'implémente ni IntersectionObserver ni scrollIntoView
  class IOStub {
    constructor(_cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  // @ts-expect-error stub de test
  global.IntersectionObserver = IOStub
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

  it('renders both panels, the active title and two pagination dots (first active)', () => {
    renderPager()
    expect(screen.getByText('PANEL ONE')).toBeInTheDocument()
    expect(screen.getByText('PANEL TWO')).toBeInTheDocument()
    expect(screen.getByText('Infos pratiques')).toBeInTheDocument()
    const dots = screen.getAllByRole('button', { name: /aller à/i })
    expect(dots).toHaveLength(2)
    expect(dots[0]).toHaveAttribute('aria-current', 'true')
    expect(dots[1]).toHaveAttribute('aria-current', 'false')
  })

  it('scrolls to the second panel when its dot is tapped', async () => {
    const user = userEvent.setup()
    renderPager()
    await user.click(screen.getByRole('button', { name: /aller à à découvrir/i }))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })
})
