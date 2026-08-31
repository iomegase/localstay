jest.mock('next/font/google', () => {
  const font = () => ({ variable: '--font-test' })

  return {
    Big_Shoulders_Inline: font,
    Lobster: font,
    Playfair_Display: font,
    Plus_Jakarta_Sans: font,
    Quicksand: font,
    Story_Script: font,
  }
})

import { metadata as rootMetadata } from '@/app/layout'
import { metadata as homePageMetadata } from '@/app/(public)/page'
import { metadata as conceptMetadata } from '@/app/(public)/concept/page'
import { metadata as ownerContactMetadata } from '@/app/(public)/confier-mon-logement/page'
import { metadata as discoveryMetadata } from '@/app/(public)/decouvrir/page'
import { metadata as lodgingsMetadata } from '@/app/(public)/logements/page'
import { metadata as seminarsMetadata } from '@/app/(public)/seminaires/page'

describe('042 AC-06-04 public page canonicals', () => {
  it('does not define a global canonical or OpenGraph URL in the root layout', () => {
    expect(rootMetadata.metadataBase).toBeInstanceOf(URL)
    expect(rootMetadata.alternates?.canonical).toBeUndefined()
    expect(rootMetadata.openGraph).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      images: expect.any(Array),
    })
    expect(rootMetadata.openGraph?.url).toBeUndefined()
  })

  it.each([
    ['homepage', homePageMetadata, '/'],
    ['concept', conceptMetadata, '/concept'],
    ['owner contact', ownerContactMetadata, '/confier-mon-logement'],
    ['discovery', discoveryMetadata, '/decouvrir'],
    ['lodgings', lodgingsMetadata, '/logements'],
    ['seminars', seminarsMetadata, '/seminaires'],
  ])('gives the representative %s page its own canonical', (_name, metadata, canonical) => {
    expect(metadata.alternates?.canonical).toBe(canonical)
  })
})
