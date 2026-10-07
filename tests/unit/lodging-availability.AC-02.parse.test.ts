import {
  availabilityHorizon,
  isBusyNight,
  monthGrid,
  parisToday,
  parseIcalBusyRanges,
} from '@/features/lodging-showcase/lib/availability'

const horizon = availabilityHorizon('2026-10-07')

const ics = [
  'BEGIN:VCALENDAR',
  'PRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261010',
  'DTEND;VALUE=DATE:20261013',
  'SUMMARY:Reserved',
  'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/ABC\\nPhone',
  '  Number (Last 4 Digits): 1234',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261012',
  'DTEND;VALUE=DATE:20261015',
  'SUMMARY:Airbnb (Not available)',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261101T150000Z',
  'DTEND:20261103T100000Z',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20260901',
  'DTEND;VALUE=DATE:20260905',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20270925',
  'DTEND;VALUE=DATE:20271005',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('spec 089 — lecture du calendrier iCal', () => {
  it('BR-02 : horizon de 12 mois à partir du 1er du mois courant', () => {
    expect(horizon).toEqual({ start: '2026-10-01', end: '2027-10-01' })
  })

  it('AC-02-02 : DTSTART inclus, DTEND exclu, plages fusionnées, hors horizon ignoré ou rogné', () => {
    expect(parseIcalBusyRanges(ics, horizon)).toEqual([
      { start: '2026-10-10', end: '2026-10-15' },
      { start: '2026-11-01', end: '2026-11-03' },
      { start: '2027-09-25', end: '2027-10-01' },
    ])
  })

  it('BR-05 : seules des dates sont conservées (aucun résumé ni description)', () => {
    const json = JSON.stringify(parseIcalBusyRanges(ics, horizon))
    expect(json).not.toMatch(/Reserved|airbnb|1234/i)
  })

  it('AC-02-02 : un événement sans DTEND bloque une nuit', () => {
    const single = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261020\nEND:VEVENT\nEND:VCALENDAR'
    expect(parseIcalBusyRanges(single, horizon)).toEqual([{ start: '2026-10-20', end: '2026-10-21' }])
  })

  it('isBusyNight : la nuit du départ est libre', () => {
    const ranges = [{ start: '2026-10-10', end: '2026-10-13' }]
    expect(isBusyNight('2026-10-10', ranges)).toBe(true)
    expect(isBusyNight('2026-10-12', ranges)).toBe(true)
    expect(isBusyNight('2026-10-13', ranges)).toBe(false)
  })

  it('AC-02-01 : semaines du lundi au dimanche', () => {
    const weeks = monthGrid('2026-10-01')
    expect(weeks[0]).toEqual([null, null, null, { date: '2026-10-01', day: 1 }, { date: '2026-10-02', day: 2 }, { date: '2026-10-03', day: 3 }, { date: '2026-10-04', day: 4 }])
    expect(weeks.flat().filter(Boolean)).toHaveLength(31)
    expect(weeks.every(week => week.length === 7)).toBe(true)
  })

  it('date du jour à Paris', () => {
    expect(parisToday(new Date('2026-10-06T22:30:00Z'))).toBe('2026-10-07')
  })
})
