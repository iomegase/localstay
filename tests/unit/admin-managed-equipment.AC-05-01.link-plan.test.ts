import { planEquipmentLinks } from '@/features/equipment-library/lib/link-plan'

describe('spec 096 AC-05-01 — reprise : liens et photos de bibliothèque', () => {
  it('rattache par nom, crée les noms inconnus, donne la 1re photo (et vidéo) aux équipements sans photo', () => {
    const plan = planEquipmentLinks(
      [
        { id: 'b1', lodging_id: 'L1', title: 'Machine à café', icon: 'info', body: 'A', photo_url: 'https://p/cafe1.webp', video_url: null },
        { id: 'b2', lodging_id: 'L2', title: 'MACHINE A CAFE', icon: 'info', body: 'B', photo_url: 'https://p/cafe2.webp', video_url: 'https://youtu.be/abc12345678' },
        { id: 'b3', lodging_id: 'L2', title: 'Sèche-cheveux', icon: 'info', body: null, photo_url: null, video_url: null },
        { id: 'b4', lodging_id: 'L2', title: 'Barbecue', icon: 'umbrella', body: 'Terrasse', photo_url: 'https://p/bbq.webp', video_url: null },
      ],
      [
        { id: 't-cafe', title_key: 'machine a cafe', photo_url: null, video_url: null },
        { id: 't-seche', title_key: 'seche cheveux', photo_url: 'https://admin/seche.webp', video_url: null },
      ],
    )
    expect(plan.create).toEqual([
      { title: 'Barbecue', title_key: 'barbecue', icon: 'umbrella', body: 'Terrasse', source_lodging_id: 'L2', photo_url: 'https://p/bbq.webp', video_url: null },
    ])
    expect(plan.media).toEqual([{ id: 't-cafe', photo_url: 'https://p/cafe1.webp', video_url: 'https://youtu.be/abc12345678' }])
    expect(plan.links).toEqual([
      { blockId: 'b1', titleKey: 'machine a cafe' },
      { blockId: 'b2', titleKey: 'machine a cafe' },
      { blockId: 'b3', titleKey: 'seche cheveux' },
      { blockId: 'b4', titleKey: 'barbecue' },
    ])
  })

  it('ignore les noms vides et le tri des déchets ; ne remplace jamais une photo déjà présente', () => {
    const plan = planEquipmentLinks(
      [
        { id: 'b1', lodging_id: 'L1', title: '  ', icon: 'info', body: null, photo_url: null, video_url: null },
        { id: 'b2', lodging_id: 'L1', title: 'Tri', icon: 'recycle', body: null, photo_url: null, video_url: null },
        { id: 'b3', lodging_id: 'L1', title: 'Télévision', icon: 'tv', body: null, photo_url: 'https://p/tv.webp', video_url: null },
      ],
      [{ id: 't-tv', title_key: 'television', photo_url: 'https://admin/tv.webp', video_url: 'https://youtu.be/xyz12345678' }],
    )
    expect(plan).toEqual({ create: [], media: [], links: [{ blockId: 'b3', titleKey: 'television' }] })
  })
})
