import { getTodayCloseLabel } from '@/features/categories/lib/is-open-now'
import type { PoiHours } from '@/features/categories/types'

// Monday 2026-06-01 at 14:00 Paris time
const monday = new Date('2026-06-01T12:00:00Z')

describe('getTodayCloseLabel', () => {
  it('returns null when hours are null', () => {
    expect(getTodayCloseLabel(null, monday)).toBeNull()
  })

  it('returns null when there is no slot for today', () => {
    const hours: PoiHours = { '1': null }
    expect(getTodayCloseLabel(hours, monday)).toBeNull()
  })

  it('formats a whole-hour closing time as "20h"', () => {
    const hours: PoiHours = { '1': { open: '09:00', close: '20:00' } }
    expect(getTodayCloseLabel(hours, monday)).toBe('20h')
  })

  it('formats a closing time with minutes as "20h30"', () => {
    const hours: PoiHours = { '1': { open: '09:00', close: '20:30' } }
    expect(getTodayCloseLabel(hours, monday)).toBe('20h30')
  })
})
