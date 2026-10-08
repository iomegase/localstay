import { resolveEquipmentMedia } from '@/features/equipment-library/lib/resolve'

describe('spec 096 AC-04-01 — icône, photo et vidéo de la bibliothèque', () => {
  it('un équipement lié affiche les valeurs actuelles de la bibliothèque, avec son nom et son texte', () => {
    expect(resolveEquipmentMedia({
      id: 'b1', title: 'Ma cafetière', body: 'Texte du logement', icon: 'info', photo_url: 'https://old/owner.jpg', video_url: null,
      equipment_template: { icon: 'utensils', photo_url: 'https://cdn/admin.webp', video_url: 'https://youtu.be/abc12345678' },
    })).toEqual({ id: 'b1', title: 'Ma cafetière', body: 'Texte du logement', icon: 'utensils', photo_url: 'https://cdn/admin.webp', video_url: 'https://youtu.be/abc12345678' })
  })

  it('une photo retirée côté admin n’affiche pas l’ancienne photo du logement', () => {
    expect(resolveEquipmentMedia({ icon: 'info', photo_url: 'https://old/owner.jpg', video_url: null, equipment_template: { icon: 'tv', photo_url: null, video_url: null } }))
      .toEqual({ icon: 'tv', photo_url: null, video_url: null })
  })

  it('un équipement historique non lié garde ses valeurs', () => {
    expect(resolveEquipmentMedia({ icon: 'bed', photo_url: 'https://old/owner.jpg', video_url: null, equipment_template: null }))
      .toEqual({ icon: 'bed', photo_url: 'https://old/owner.jpg', video_url: null })
  })
})
