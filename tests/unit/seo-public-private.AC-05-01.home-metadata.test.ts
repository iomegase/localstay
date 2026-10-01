import { homeMetadata } from '@/features/seo/lib/metadata'

describe('042 AC-05-01 homepage metadata', () => {
  it('uses the exact concierge positioning without inheriting the root title template', () => {
    const metadata = homeMetadata()

    expect(metadata.title).toEqual({
      absolute: 'Conciergerie dans le Pays du Mont-Blanc | MyStay',
    })
    expect(metadata.description).toBe(
      'MyStay, conciergerie dans le Pays du Mont-Blanc : accueil des voyageurs, préparation des logements, ménage, linge, intendance et guide digital.',
    )
    expect(metadata.alternates?.canonical).toBe('/')
  })

  it('keeps OpenGraph aligned with the canonical homepage metadata', () => {
    const metadata = homeMetadata()

    expect(metadata.openGraph).toMatchObject({
      title: 'Conciergerie dans le Pays du Mont-Blanc | MyStay',
      description:
        'MyStay, conciergerie dans le Pays du Mont-Blanc : accueil des voyageurs, préparation des logements, ménage, linge, intendance et guide digital.',
      url: '/',
      images: ['/og-mystay.png'],
    })
  })
})
