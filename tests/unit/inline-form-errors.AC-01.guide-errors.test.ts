import { errorsUnder, issuesToErrors, validateGuideForm, valueAtPath, visibleServerErrors } from '@/features/guide-customization/lib/form-errors'

// Spec 083 — erreurs sous les champs de la page Guide.
const base = {
  arrival_instructions: [{ title: 'Portail', text: '' }, { title: null, text: '  ', photos: [], video_url: null, substeps: [], facts: [] }],
  practical_blocks: [{ title: '', video_url: 'https://vimeo.com/1' }],
  address_postal_code: '7417',
  presentation_video_url: 'https://youtu.be/dQw4w9WgXcQ',
}

describe('083 AC-01-01 — validation du formulaire Guide', () => {
  it('signale chaque champ fautif par son chemin', () => {
    expect(validateGuideForm(base)).toEqual({
      'arrival_instructions.1.text': 'Étape vide : ajoutez un titre, un texte ou une photo.',
      'practical_blocks.0.title': 'Le nom de l’équipement est requis.',
      'practical_blocks.0.video_url': 'Lien YouTube invalide.',
      address_postal_code: 'Le code postal doit contenir 5 chiffres.',
    })
  })

  it('formulaire valide → aucune erreur', () => {
    expect(validateGuideForm({ arrival_instructions: [{ text: 'ok' }], practical_blocks: [{ title: 'Ski', video_url: null }], address_postal_code: '', presentation_video_url: null })).toEqual({})
  })
})

describe('083 AC-01-02 / AC-01-03 — erreurs de l’API', () => {
  it('chemins de l’API, premier message par champ', () => {
    expect(issuesToErrors([
      { path: 'arrival_instructions.0.text', message: "Le texte de l'instruction est requis." },
      { path: 'arrival_instructions.0.text', message: 'autre' },
      { path: 'wifi_ssid', message: 'Trop long' },
    ])).toEqual({ 'arrival_instructions.0.text': "Le texte de l'instruction est requis.", wifi_ssid: 'Trop long' })
  })

  it('lit une valeur par chemin et masque les erreurs dont le champ a changé', () => {
    expect(valueAtPath(base, 'arrival_instructions.0.title')).toBe('Portail')
    const errors = { 'arrival_instructions.1.text': 'requis', wifi_ssid: 'trop long' }
    const snapshot = { 'arrival_instructions.1.text': JSON.stringify('  '), wifi_ssid: JSON.stringify('x') }
    expect(visibleServerErrors(errors, snapshot, { ...base, wifi_ssid: 'y' })).toEqual({ 'arrival_instructions.1.text': 'requis' })
  })

  it('sous-ensemble pour un éditeur', () => {
    expect(errorsUnder({ 'arrival_instructions.1.text': 'a', 'practical_blocks.0.title': 'b' }, 'arrival_instructions')).toEqual({ '1.text': 'a' })
  })
})
