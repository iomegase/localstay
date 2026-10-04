import React from 'react'
import type { Metadata } from 'next'
import { PRIVATE_ROBOTS, privatePageMetadata } from '@/features/seo/lib/private-metadata'

const mockGetActiveLodgingContext = jest.fn()
jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

import SejourLayout, { generateMetadata as generateSejourMetadata } from '@/app/(public)/sejour/layout'
import { GuidePwaRuntime } from '@/features/guide-pwa/components/GuidePwaRuntime'
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

  beforeEach(() => mockGetActiveLodgingContext.mockResolvedValue(null))

  it.each([
    ['sejour', () => generateSejourMetadata(), 'Votre séjour'],
    ['guide compatibility', async () => guideMetadata, 'Guide privé'],
  ])('applies the exact policy to the %s layout', async (_name, resolveMetadata: () => Promise<Metadata>, title) => {
    const metadata = await resolveMetadata()
    expect(metadata.robots).toEqual(expectedRobots)
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.title).toBe(title)
  })

  it('keeps both private layouts transparent Server Components without an active stay', async () => {
    const child = React.createElement('p', null, 'Contenu privé')

    expect(await SejourLayout({ children: child })).toBe(child)
    expect(GuideLayout({ children: child })).toBe(child)
  })

  it('059 AC-01-01: adds the lodging manifest and the PWA runtime during an active stay', async () => {
    const lodgingId = '11111111-1111-4111-8111-111111111111'
    mockGetActiveLodgingContext.mockResolvedValue({ lodgingId })
    const child = React.createElement('p', null, 'Contenu privé')

    const metadata = await generateSejourMetadata()
    expect(metadata).toEqual({ ...privatePageMetadata('Votre séjour'), manifest: `/api/guide/manifest?lodging=${lodgingId}` })

    const layout = (await SejourLayout({ children: child })) as React.ReactElement<{ lodgingId: string; children: React.ReactNode }>
    expect(layout.type).toBe(GuidePwaRuntime)
    expect(layout.props.lodgingId).toBe(lodgingId)
    expect(layout.props.children).toBe(child)
  })
})
