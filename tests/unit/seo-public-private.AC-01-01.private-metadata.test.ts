import React from 'react'
import { PRIVATE_ROBOTS, privatePageMetadata } from '@/features/seo/lib/private-metadata'
import SejourLayout, { metadata as sejourMetadata } from '@/app/(public)/sejour/layout'
import GuideLayout, { metadata as guideMetadata } from '@/app/(public)/guide/[city-slug]/layout'

const expectedRobots = {
  index: false,
  follow: false,
  noarchive: true,
}

describe('042 SEO private metadata — AC-01-01', () => {
  it('defines one exact robots policy and a typed metadata factory', () => {
    expect(PRIVATE_ROBOTS).toEqual(expectedRobots)
    expect(privatePageMetadata('Espace privé')).toEqual({
      title: 'Espace privé',
      robots: expectedRobots,
    })
  })

  it.each([
    ['sejour', sejourMetadata, 'Votre séjour'],
    ['guide compatibility', guideMetadata, 'Guide privé'],
  ])('applies the exact policy to the %s layout', (_name, metadata, title) => {
    expect(metadata.robots).toEqual(expectedRobots)
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.title).toBe(title)
  })

  it('keeps both private layouts transparent Server Components', () => {
    const child = React.createElement('p', null, 'Contenu privé')

    expect(SejourLayout({ children: child })).toBe(child)
    expect(GuideLayout({ children: child })).toBe(child)
  })
})
