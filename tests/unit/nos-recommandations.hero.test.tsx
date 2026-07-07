/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { Hero } from '@/app/(public)/nos-recommandations/_components/Hero'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Hero', () => {
  it('renders the owner title, lodging info and stats', () => {
    render(
      <Hero
        ownerName="Alice"
        lodgingName="Chalet Rémy"
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais"
        stats={{ places: 12, categories: 4, cities: 2 }}
      />,
    )
    expect(screen.getByText('Les recommandations de Alice')).toHaveClass('font-hand')
    expect(screen.getByText('Chalet Rémy')).toHaveClass('font-hand')
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('falls back to a generic title without an owner name', () => {
    render(
      <Hero
        ownerName={null}
        lodgingName="Chalet Rémy"
        cityName="Saint-Gervais-les-Bains"
        citySlug="saint-gervais"
        stats={{ places: 0, categories: 0, cities: 0 }}
      />,
    )
    expect(screen.getByText('Les recommandations de votre hôte')).toBeInTheDocument()
  })
})
