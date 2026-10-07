/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'

const mockFindFirst = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { lodgingPublicProfile: { findFirst: (...args: unknown[]) => mockFindFirst(...args) } } }))
jest.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))

import { LodgingAvailabilityCalendar } from '@/features/lodging-showcase/components/LodgingAvailabilityCalendar'
import { LodgingAvailability } from '@/features/lodging-showcase/components/LodgingAvailability'

const busy = [{ start: '2026-10-10', end: '2026-10-13' }]
const state = (date: string) => document.querySelector(`[data-date="${date}"]`)?.getAttribute('data-state')

describe('spec 089 AC-02 — calendrier des disponibilités', () => {
  it('AC-02-02 : jours passés grisés, nuits réservées indisponibles, nuit du départ libre', () => {
    render(<LodgingAvailabilityCalendar today="2026-10-07" busy={busy} />)
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('octobre 2026')
    expect(state('2026-10-06')).toBe('past')
    expect(state('2026-10-07')).toBe('available')
    expect(state('2026-10-10')).toBe('busy')
    expect(state('2026-10-12')).toBe('busy')
    expect(state('2026-10-13')).toBe('available')
    expect(screen.getByText('Disponible')).toBeInTheDocument()
    expect(screen.getByText('Indisponible')).toBeInTheDocument()
    expect(screen.getByText('Réservation sur la plateforme')).toBeInTheDocument()
  })

  it('AC-02-01 : 12 mois navigables, boutons désactivés aux bornes', () => {
    render(<LodgingAvailabilityCalendar today="2026-10-07" busy={busy} />)
    const previous = screen.getByRole('button', { name: 'Mois précédent' })
    const next = screen.getByRole('button', { name: 'Mois suivant' })
    expect(previous).toBeDisabled()
    expect(screen.getAllByTestId('availability-month').map(month => month.querySelector('h3')?.textContent)).toEqual(['octobre 2026', 'novembre 2026'])

    for (let click = 0; click < 11; click += 1) fireEvent.click(next)
    expect(next).toBeDisabled()
    expect(screen.getAllByTestId('availability-month').map(month => month.querySelector('h3')?.textContent)).toEqual(['septembre 2027'])
    fireEvent.click(previous)
    expect(screen.getAllByTestId('availability-month')[0]!.querySelector('h3')).toHaveTextContent('août 2027')
  })

  it('AC-02-03 : sans lien iCal, la section n’est pas rendue', async () => {
    mockFindFirst.mockResolvedValue({ availability_ical_url: null })
    await expect(LodgingAvailability({ profileId: 'profile-1' })).resolves.toBeNull()
    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'profile-1', publication_status: 'published', deleted_at: null },
    }))
  })

  it('AC-02-03 : calendrier injoignable → section absente, sans erreur', async () => {
    mockFindFirst.mockResolvedValue({ availability_ical_url: 'https://calendrier-introuvable.invalid/c.ics' })
    await expect(LodgingAvailability({ profileId: 'profile-1' })).resolves.toBeNull()
  })
})
