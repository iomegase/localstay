import { homeMetadata } from '@/features/seo/lib/metadata'

describe('042 AC-05-01 homepage metadata', () => {
  it('uses the exact concierge positioning without inheriting the root title template', () => {
    const metadata = homeMetadata()

    expect(metadata.title).toEqual({
      absolute: 'Conciergerie en Haute-Savoie | MyStay',
    })
    expect(metadata.description).toBe(
      'Gestion de locations saisonnières en Haute-Savoie : accueil voyageurs, ménage, linge, intendance et guide digital MyStay.',
    )
    expect(metadata.alternates?.canonical).toBe('/')
  })

  it('keeps OpenGraph aligned with the canonical homepage metadata', () => {
    const metadata = homeMetadata()

    expect(metadata.openGraph).toMatchObject({
      title: 'Conciergerie en Haute-Savoie | MyStay',
      description:
        'Gestion de locations saisonnières en Haute-Savoie : accueil voyageurs, ménage, linge, intendance et guide digital MyStay.',
      url: '/',
      images: ['/og-mystay.png'],
    })
  })
})
