/** @jest-environment jsdom */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { LocalVacationRentalLanding } from '@/features/local-seo/components/LocalVacationRentalLanding'

jest.mock('next/navigation', () => ({ usePathname: () => '/locations-vacances/saint-gervais-les-bains' }))

describe('031 AC-01-24 — retrait horizontal des heros', () => {
  it.each([
    'src/features/local-seo/components/LocalVacationRentalLanding.tsx',
    'src/features/local-seo/components/LocalConciergeLanding.tsx',
    'src/features/local-seo/components/LocalServiceLanding.tsx',
    'src/features/public-discovery/components/DiscoveryIndexView.tsx',
    'src/features/public-discovery/components/DiscoveryCityView.tsx',
    'src/features/public-discovery/components/DiscoveryCategoryView.tsx',
  ])('%s utilise marketingHeroInsetClass', file => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    expect(source).toContain('marketingHeroInsetClass')
    // Jamais sur le même élément que le conteneur (conflit de padding).
    expect(source).not.toMatch(/\$\{marketingContainerClass\} \$\{marketingHeroInsetClass\}/)
  })
})

describe('046 AC-03-16 — titre de la landing locations sur deux lignes', () => {
  const landing = publicLocalLanding('VACATION_RENTAL', { id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' })

  it('splits before the city, city in serif italic 34px, accessible text unchanged', () => {
    const page = { ...landing, page: { ...landing.page, h1: 'Locations de vacances à Saint-Gervais-les-Bains' } }
    render(<LocalVacationRentalLanding landing={page} lodgings={[]} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent!.replace(/\s+/g, ' ').trim()).toBe('Locations de vacances à Saint-Gervais-les-Bains')
    expect(within(h1).getByTestId('vacation-title-city')).toHaveTextContent(/^Saint-Gervais-les-Bains$/)
    expect(within(h1).getByTestId('vacation-title-city')).toHaveClass('font-serif', 'italic', 'text-[34px]')
    expect(screen.getByTestId('vacation-hero')).toHaveClass('px-7', 'min-[761px]:px-[54px]')
  })

  it('keeps a title without « à » on one line', () => {
    const page = { ...landing, page: { ...landing.page, h1: 'Nos locations de vacances' } }
    render(<LocalVacationRentalLanding landing={page} lodgings={[]} />)
    expect(screen.queryByTestId('vacation-title-city')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nos locations de vacances')
  })
})
