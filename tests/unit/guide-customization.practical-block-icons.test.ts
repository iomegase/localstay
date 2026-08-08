import {
  PRACTICAL_BLOCK_ICONS,
  PRACTICAL_BLOCK_ICON_SLUGS,
  DEFAULT_PRACTICAL_BLOCK_ICON,
} from '@/features/guide-customization/lib/practical-block-icons'

describe('practical block icon catalog', () => {
  it('exposes a non-empty catalog with unique slugs and labels', () => {
    expect(PRACTICAL_BLOCK_ICONS.length).toBeGreaterThan(0)
    const slugs = PRACTICAL_BLOCK_ICONS.map(i => i.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(PRACTICAL_BLOCK_ICONS.every(i => i.label.trim().length > 0)).toBe(true)
  })

  it('derives the slug list from the catalog', () => {
    expect(PRACTICAL_BLOCK_ICON_SLUGS).toEqual(PRACTICAL_BLOCK_ICONS.map(i => i.slug))
  })

  it('uses a default icon that exists in the catalog', () => {
    expect(PRACTICAL_BLOCK_ICON_SLUGS).toContain(DEFAULT_PRACTICAL_BLOCK_ICON)
  })

  it('exposes the approved amenity icons', () => {
    expect(PRACTICAL_BLOCK_ICONS).toEqual(
      expect.arrayContaining([
        { slug: 'waves-ladder', label: 'Piscine' },
        { slug: 'bubbles', label: 'Jacuzzi' },
        { slug: 'air-vent', label: 'Climatisation' },
        { slug: 'mountain-snow', label: 'Skis' },
        { slug: 'umbrella', label: 'Terrasse' },
      ]),
    )
  })
})
