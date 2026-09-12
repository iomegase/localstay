import { homeMetadata } from '@/features/seo/lib/metadata'

describe('042 AC-05-01 homepage metadata', () => {
  it('uses the exact concierge positioning without inheriting the root title template', () => {
    const metadata = homeMetadata()

    expect(metadata.title).toEqual({
      absolute: 'Conciergerie à Saint-Gervais-les-Bains | MyStay',
    })
    expect(metadata.description).toBe(
      'MyStay, conciergerie à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : accueil voyageurs, préparation des logements, ménage, linge, intendance et guides digitaux.',
    )
    expect(metadata.alternates?.canonical).toBe('/')
  })

  it('keeps OpenGraph aligned with the canonical homepage metadata', () => {
    const metadata = homeMetadata()

    expect(metadata.openGraph).toMatchObject({
      title: 'Conciergerie à Saint-Gervais-les-Bains | MyStay',
      description:
        'MyStay, conciergerie à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : accueil voyageurs, préparation des logements, ménage, linge, intendance et guides digitaux.',
      url: '/',
      images: ['/og-mystay.png'],
    })
  })
})
