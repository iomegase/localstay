/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'

import { LodgingFeatureSections } from '@/features/lodging-showcase/components/LodgingFeatureSections'

const expectedIcons = [
  ['Petit-déjeuner', 'lucide-coffee'],
  ['Transfert aéroport', 'lucide-plane'],
  ['Ménage', 'lucide-spray-can'],
  ['Conciergerie', 'lucide-concierge-bell'],
  ["Courses à l'arrivée", 'lucide-shopping-basket'],
  ['Piscine', 'lucide-waves-ladder'],
] as const

describe('lodging feature semantic icons', () => {
  it.each(expectedIcons)('uses the matching icon for %s', (label, iconClass) => {
    render(
      <LodgingFeatureSections
        bedroomCount={null}
        bedCount={null}
        includedAmenities={['Piscine']}
        onRequestAmenities={[
          'Petit-déjeuner',
          'Transfert aéroport',
          'Ménage',
          'Conciergerie',
          "Courses à l'arrivée",
        ]}
      />,
    )

    const row = screen.getByText(label).closest('li')
    expect(row?.querySelector('svg')).toHaveClass(iconClass)
    expect(row?.querySelector('svg')).not.toHaveClass('lucide-sparkles')
  })
})

// Spec 086 AC-04 — chaque équipement / service du catalogue a son icône dédiée.
import { Sparkles } from 'lucide-react'
import { AMENITY_CATALOG } from '@/features/lodging-showcase/lib/amenity-catalog'
import { featureIconFor } from '@/features/lodging-showcase/lib/feature-icon'

describe('086 AC-04 — icônes du catalogue', () => {
  it.each(AMENITY_CATALOG.map(item => item.label))('%s n’utilise pas l’icône générique', label => {
    expect(featureIconFor(label)).not.toBe(Sparkles)
  })
})
