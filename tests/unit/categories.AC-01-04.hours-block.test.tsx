/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { HoursBlock } from '@/features/categories/components/HoursBlock'
import type { PoiHours } from '@/features/categories/types'

const hours: PoiHours = {
  '0': null,
  '1': { open: '12:00', close: '14:30' },
  '2': { open: '12:00', close: '14:30' },
  '3': { open: '12:00', close: '14:30' },
  '4': { open: '12:00', close: '14:30' },
  '5': { open: '12:00', close: '14:30' },
  '6': { open: '19:00', close: '22:30' },
}

describe('HoursBlock — AC-01-04 (open badge)', () => {
  it('shows "Ouvert" badge with closing time when is_open_now=true and hours available', () => {
    render(<HoursBlock is_open_now={true} hours={hours} today={1} />)
    expect(screen.getByTestId('badge-open')).toBeInTheDocument()
    expect(screen.getByTestId('badge-open')).toHaveTextContent('Ouvert')
    expect(screen.getByTestId('closing-time')).toHaveTextContent('14:30')
  })

  it('can hide the open badge while keeping the closing time in place', () => {
    render(<HoursBlock is_open_now={true} hours={hours} today={1} showOpenBadge={false} />)
    expect(screen.queryByTestId('badge-open')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-time')).toHaveTextContent('14:30')
  })

  it('does NOT show open badge when is_open_now=false', () => {
    render(<HoursBlock is_open_now={false} hours={hours} today={1} />)
    expect(screen.queryByTestId('badge-open')).not.toBeInTheDocument()
  })

  it('does NOT show open badge when is_open_now=null (unknown)', () => {
    render(<HoursBlock is_open_now={null} hours={hours} today={1} />)
    expect(screen.queryByTestId('badge-open')).not.toBeInTheDocument()
  })

  it('renders "Fermé" for days with null hours (Sunday=0) when expanded', () => {
    render(<HoursBlock is_open_now={false} hours={hours} today={1} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('hours-row-0')).toHaveTextContent('Fermé')
  })

  it('renders nothing when hours is null', () => {
    const { container } = render(<HoursBlock is_open_now={null} hours={null} today={1} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows today row in bold when expanded (today=2)', () => {
    render(<HoursBlock is_open_now={true} hours={hours} today={2} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('hours-row-2')).toHaveClass('font-bold')
  })
})
