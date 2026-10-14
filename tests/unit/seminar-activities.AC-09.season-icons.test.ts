import { parseSeasonLabel } from '@/features/seminar-activities/lib/seasons'
import { SEMINAR_SEASON_OPTIONS } from '@/features/seminar-activities/lib/options'

describe('spec 097 UI — saisons en icônes', () => {
  it.each([
    ['Toute l’année', ['winter', 'spring', 'summer', 'autumn'], null],
    ['Toute l\'année selon la formule', ['winter', 'spring', 'summer', 'autumn'], 'selon la formule'],
    ['Hiver', ['winter'], null],
    ['Été', ['summer'], null],
    ['Printemps, été', ['spring', 'summer'], null],
    ['Printemps, été, automne', ['spring', 'summer', 'autumn'], null],
  ])('« %s » → %p, précision %p', (label, seasons, note) => {
    expect(parseSeasonLabel(label)).toEqual({ seasons, note })
  })

  it.each(['Selon conditions', 'Selon ouverture du téléphérique', 'Hiver selon neige', ''])('« %s » reste en texte', label => {
    expect(parseSeasonLabel(label)).toBeNull()
  })

  it('les options sans saison identifiable sont uniquement les « Selon … »', () => {
    expect(SEMINAR_SEASON_OPTIONS.filter(option => parseSeasonLabel(option) === null))
      .toEqual(['Selon ouverture', 'Selon ouverture du téléphérique', 'Selon conditions'])
  })
})
