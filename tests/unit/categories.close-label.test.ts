import {
  computeIsOpenNow,
  getTodayCloseLabel,
  getNextOpenLabel,
} from '@/features/categories/lib/is-open-now'
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

describe('computeIsOpenNow overnight day ownership', () => {
  const mondayOvernight: PoiHours = { '1': { open: '22:00', close: '02:00' } }

  it('does not treat Monday 01:00 as part of the Monday night slot', () => {
    const mondayAtOneParis = new Date('2026-05-31T23:00:00Z')
    expect(computeIsOpenNow(mondayOvernight, mondayAtOneParis)).toBe(false)
  })

  it('opens after the Monday start and through early Tuesday only', () => {
    const mondayAtElevenParis = new Date('2026-06-01T21:00:00Z')
    const tuesdayAtOneParis = new Date('2026-06-01T23:00:00Z')
    const tuesdayAtThreeParis = new Date('2026-06-02T01:00:00Z')

    expect(computeIsOpenNow(mondayOvernight, mondayAtElevenParis)).toBe(true)
    expect(computeIsOpenNow(mondayOvernight, tuesdayAtOneParis)).toBe(true)
    expect(computeIsOpenNow(mondayOvernight, tuesdayAtThreeParis)).toBe(false)
  })
})
