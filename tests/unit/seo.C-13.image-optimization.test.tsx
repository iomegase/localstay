/** @jest-environment jsdom */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'

// Audit SEO/GEO 2026-10-05, C-13 : les photos publiques passent par l'optimiseur
// d'images Next (redimensionnement, AVIF/WebP) et seule l'image principale est prioritaire.
const OPTIMIZED_SOURCES = [
  'src/features/lodging-showcase/components/LodgingMarketingGallery.tsx',
  'src/features/lodging-showcase/components/LodgingRoomsGrid.tsx',
  'src/features/lodging-showcase/components/CompactLodgingCard.tsx',
  'src/features/local-seo/components/LocalRentalCard.tsx',
  'src/features/marketing/components/MarketingPropertyCard.tsx',
  'src/app/(public)/journal/page.tsx',
  'src/app/(public)/journal/[slug]/page.tsx',
] as const

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('C-13 — optimisation des images publiques', () => {
  it.each(OPTIMIZED_SOURCES)('%s ne contourne plus l’optimiseur d’images', path => {
    expect(read(path)).not.toMatch(/\bunoptimized\b/)
  })

  it.each(OPTIMIZED_SOURCES)('%s n’utilise plus la prop priority dépréciée en Next 16', path => {
    // Attribut JSX `priority` / `priority={…}` (pas la prop des composants eux-mêmes).
    expect(read(path)).not.toMatch(/^\s*priority(=\{|\s*$)/m)
  })

  it('la galerie marque uniquement sa photo principale en haute priorité', () => {
    const source = read('src/features/lodging-showcase/components/LodgingMarketingGallery.tsx')
    expect(source.match(/fetchPriority="high"/g)).toHaveLength(1)
  })

  it('les photos des pièces sont chargées en différé, sans <img> brut', () => {
    expect(read('src/features/lodging-showcase/components/LodgingRoomsGrid.tsx')).not.toContain('<img')
    render(
      <LodgingRoomsGrid
        photos={[
          { id: 'p1', url: 'https://example.supabase.co/a.avif', alt: 'Salon lumineux', room_type: 'living_room', room_label: null, sort_order: 1, is_cover: false },
          { id: 'p2', url: 'https://example.supabase.co/b.avif', alt: 'Cuisine équipée', room_type: 'kitchen', room_label: null, sort_order: 2, is_cover: false },
        ]}
      />,
    )
    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('loading', 'lazy')
    }
  })
})
