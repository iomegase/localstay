import { getTodayCloseLabel, getNextOpenLabel } from '@/features/categories/lib/is-open-now'
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

describe('getNextOpenLabel', () => {
  it('returns null when hours are null', () => {
    expect(getNextOpenLabel(null, monday)).toBeNull()
  })

  it('reports a later-today opening as "aujourd\'hui à ..."', () => {
    const hours: PoiHours = { '1': { open: '16:00', close: '20:00' } }
    expect(getNextOpenLabel(hours, monday)).toBe("aujourd'hui à 16h")
  })

  it('reports a next-day opening as "demain à ..."', () => {
    const hours: PoiHours = { '2': { open: '09:00', close: '19:00' } }
    expect(getNextOpenLabel(hours, monday)).toBe('demain à 9h')
  })

  it('reports a further day with its weekday name', () => {
    const hours: PoiHours = { '4': { open: '09:00', close: '18:00' } }
    expect(getNextOpenLabel(hours, monday)).toBe('jeudi à 9h')
  })

  it("skips today's slot once it has already opened, and keeps minutes", () => {
    const hours: PoiHours = {
      '1': { open: '09:00', close: '12:00' },
      '2': { open: '09:30', close: '19:00' },
    }
    expect(getNextOpenLabel(hours, monday)).toBe('demain à 9h30')
  })
})
