import { normalizeEventTypes } from '@/features/events-acquisition/lib/event-types'

describe('normalizeEventTypes', () => {
  it('mappe les sous-types DATAtourisme préfixés vers le vocabulaire interne', () => {
    expect(normalizeEventTypes(['schema:Event', 'CulturalEvent'])).toEqual(['cultural'])
    expect(normalizeEventTypes(['SportsCompetition'])).toEqual(['sport'])
    expect(normalizeEventTypes(['SaleEvent'])).toEqual(['market'])
  })

  it('déduplique et combine plusieurs types', () => {
    const r = normalizeEventTypes(['CulturalEvent', 'FestivalEvent', 'CulturalEvent'])
    expect(r.sort()).toEqual(['cultural', 'festival'])
  })

  it('renvoie ["other"] quand aucun type connu', () => {
    expect(normalizeEventTypes(['schema:Event', 'Unknown'])).toEqual(['other'])
    expect(normalizeEventTypes([])).toEqual(['other'])
  })
})
