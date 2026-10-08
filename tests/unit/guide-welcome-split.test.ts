import { splitWelcome } from '@/features/guide-app/components/stay/GuideStayHome'

// 2026-10-08 : « Les Hauts de Saint Gervais » s'affichait « Bienvenue au / x Hauts de Saint Gervais ».
describe('splitWelcome — accueil du guide', () => {
  it.each([
    ['Les Hauts de Saint Gervais', 'Bienvenue aux', 'Hauts de Saint Gervais'],
    ['Le 305', 'Bienvenue au', '305'],
    ['La Ferme du Mont', 'Bienvenue à la', 'Ferme du Mont'],
    ['Chalet Hygge', 'Bienvenue à', 'Chalet Hygge'],
  ])('%s → « %s » + « %s »', (name, lead, rest) => {
    const welcome = splitWelcome(name)
    expect(welcome.lead).toBe(lead)
    expect(welcome.name).toBe(rest)
  })

  it('élision : « L’Aiguille » → « Bienvenue à » + « l’Aiguille »', () => {
    const welcome = splitWelcome('L’Aiguille')
    expect(`${welcome.lead} ${welcome.name}`).toMatch(/^Bienvenue à l['’]Aiguille$/)
  })
})
