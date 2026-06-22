/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import LeLogementPage from '@/app/(public)/le-logement/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingCustomization: { findFirst: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

describe('/le-logement — blocs personnalisés', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders custom blocks after the fixed sections, with markdown and photo', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'La plage', body: 'À **5 min** à pied', icon: 'star', photo_url: 'https://cdn.test/plage.webp', sort_order: 0 },
    ] as never)

    render(await LeLogementPage())

    expect(screen.getByText('La plage')).toBeInTheDocument()
    expect(screen.getByText(/5 min/)).toBeInTheDocument()
    expect(screen.getByAltText('La plage')).toHaveAttribute('src', 'https://cdn.test/plage.webp')
  })

  it('treats blocks as content (no empty state when only blocks exist)', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Bons plans', body: null, icon: 'info', photo_url: null, sort_order: 0 },
    ] as never)

    render(await LeLogementPage())

    expect(screen.getByText('Bons plans')).toBeInTheDocument()
    expect(screen.queryByText(/n'a pas encore renseigné/i)).not.toBeInTheDocument()
  })
})
