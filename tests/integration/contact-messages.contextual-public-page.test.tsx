/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContextualContactPage from '@/app/(public)/guide/[city-slug]/contact/page'
import { prisma } from '@/shared/lib/prisma'

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCityForSeo: jest.fn(async () => ({ name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains', region: 'Auvergne-Rhone-Alpes' })),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: '11111111-1111-4111-8111-111111111111',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais-les-bains',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source, className }: { source: string; className?: string }) => (
    <div className={className}>{source}</div>
  ),
}))

jest.mock('@/features/public-menu/components/LeaveStayButton', () => ({
  LeaveStayButton: () => <button type="button">Quitter le séjour</button>,
}))

describe('024 contextual public contact page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.lodging.findFirst as jest.Mock).mockResolvedValue({
      owner: { first_name: 'Alice', last_name: 'Martin', email: 'alice@example.test' },
      customization: { emergency_contacts: 'Pompiers : 18' },
    })
  })

  it('renders the lodging contact form on /guide/[city-slug]/contact', async () => {
    render(await ContextualContactPage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) }))

    expect(screen.getAllByText(/Chalet MyStay/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Saint-Gervais-les-Bains/)).toBeInTheDocument()
    expect(screen.getByLabelText('Destination')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
    expect(mockNotFound).not.toHaveBeenCalled()
  })
})
