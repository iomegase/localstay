import {
  FIXED_DEPARTURE_INSTRUCTIONS,
  FIXED_HOUSE_RULES,
} from '@/features/guide-app/lib/fixed-lodging-content'

describe('fixed lodging content', () => {
  it('exposes the nine departure instructions', () => {
    expect(FIXED_DEPARTURE_INSTRUCTIONS).toEqual([
      'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
      'Faire la vaisselle ou lancer le lave-vaisselle avant votre départ.',
      'Rassembler le linge de toilette utilisé dans la salle de bain.',
      'Laisser les draps en place sur les lits.',
      "Remettre les meubles, chaises et objets déplacés à leur emplacement d'origine.",
      'Fermer les fenêtres et les Velux.',
      'Éteindre les lumières ainsi que les appareils électriques inutiles.',
      'Ne pas éteindre le chauffage.',
      "Vérifier que vous n'avez rien oublié dans le logement.",
    ])
  })

  it('exposes the three house rules', () => {
    expect(FIXED_HOUSE_RULES).toEqual([
      'Merci de respecter le logement, son mobilier ainsi que le voisinage pendant toute la durée de votre séjour.',
      'Les fêtes et nuisances sonores, notamment entre 22 h et 8 h, ne sont pas autorisées.',
      "Merci d'utiliser les équipements conformément à leur destination et de nous signaler rapidement tout incident ou dommage.",
    ])
  })
})

