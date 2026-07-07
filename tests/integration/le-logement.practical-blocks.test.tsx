/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import LeLogementPage from '@/app/(public)/le-logement/page'
import { prisma } from '@/shared/lib/prisma'

beforeAll(() => {
  class IOStub {
    constructor(_cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  // @ts-expect-error stub de test
  global.IntersectionObserver = IOStub
  Element.prototype.scrollIntoView = jest.fn()
})

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
    // Le pager n'affiche que le titre actif ; le second titre est exposé
    // uniquement via l'aria-label du dot de la page 2.
    expect(screen.getByText('Quelques conseils & consignes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aller à quelques recommandations/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /aller à/i })).toHaveLength(2)
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

  it('moves the fixed checkout section to the second lodging page before custom blocks', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: 'Merci de vider le frigo.',
      trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Poubelles', body: 'Local en bas du bâtiment.', icon: 'trash', photo_url: null, sort_order: 0 },
    ] as never)

    const { container } = render(await LeLogementPage())
    const panels = container.querySelectorAll('[aria-roledescription="carrousel"] > div')

    expect(panels).toHaveLength(2)
    expect(panels[0]).not.toHaveTextContent('Départ')
    expect(panels[1]).toHaveTextContent('Départ')

    const secondPage = within(panels[1] as HTMLElement)
    const checkoutHeading = secondPage.getByRole('heading', { name: 'Départ' })
    const customBlockHeading = secondPage.getByRole('heading', { name: 'Poubelles' })

    expect(checkoutHeading.compareDocumentPosition(customBlockHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('renders a single list without pager when there are no custom blocks', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    render(await LeLogementPage())

    expect(screen.getByText('1 rue des Alpes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aller à/i })).not.toBeInTheDocument()
    expect(screen.queryByText('À découvrir')).not.toBeInTheDocument()
  })

  it('renders the lodging welcome message with the owner script font', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: 'Bienvenue au chalet',
      cover_photo_url: null,
      presentation_video_url: null,
      lodging_address: null,
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    render(await LeLogementPage())

    expect(screen.getByTestId('lodging-welcome-message')).toHaveClass('font-hand')
    expect(screen.getByText('Bienvenue au chalet')).toBeInTheDocument()
  })
})
