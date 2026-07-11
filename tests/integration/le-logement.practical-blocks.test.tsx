/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    const user = userEvent.setup()
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
    await user.click(screen.getByRole('button', { name: /aller à bon à savoir/i }))

    expect(screen.getByText('La plage')).toBeInTheDocument()
    expect(screen.getByText(/5 min/)).toBeInTheDocument()
    expect(screen.getByAltText('La plage')).toHaveAttribute('src', 'https://cdn.test/plage.webp')
    expect(screen.getByRole('button', { name: /aller à bienvenue/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aller à infos pratiques/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aller à bon à savoir/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aller à départ & consignes/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /aller à/i })).toHaveLength(4)
  })

  it('treats blocks as content (no empty state when only blocks exist)', async () => {
    const user = userEvent.setup()
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Bons plans', body: null, icon: 'info', photo_url: null, sort_order: 0 },
    ] as never)

    render(await LeLogementPage())
    await user.click(screen.getByRole('button', { name: /aller à bon à savoir/i }))

    expect(screen.getByText('Bons plans')).toBeInTheDocument()
    expect(screen.queryByText(/n'a pas encore renseigné/i)).not.toBeInTheDocument()
  })

  it('renders the lodging video card between address and parking', async () => {
    const user = userEvent.setup()
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      cover_photo_url: null,
      presentation_video_url: 'https://youtu.be/dQw4w9WgXcQ',
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: 'Place 12 dans la cour.', equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    render(await LeLogementPage())
    await user.click(screen.getByRole('button', { name: /aller à infos pratiques/i }))

    const addressHeading = screen.getByRole('heading', { name: 'Adresse' })
    const videoButton = screen.getByRole('button', { name: 'Lire la vidéo : Vidéo du logement' })
    const parkingHeading = screen.getByRole('heading', { name: 'Parking' })

    expect(addressHeading.compareDocumentPosition(videoButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(videoButton.compareDocumentPosition(parkingHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('renders welcome on page 1, practical on page 2, owner blocks on page 3 and departure on page 4', async () => {
    const user = userEvent.setup()
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: 'Bienvenue au chalet',
      cover_photo_url: 'https://cdn.test/chalet.webp',
      presentation_video_url: null,
      lodging_address: '1 rue des Alpes',
      wifi_ssid: 'Livebox-75E0', wifi_password: 'secret-wifi', parking_info: null, equipment_info: null,
      checkout_instructions: 'Merci de vider le frigo.',
      trash_info: null, trash_location: 'Point tri en bas du bâtiment', trash_bins: [{ type: 'jaune' }],
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Infos locales', body: 'Local en bas du bâtiment.', icon: 'info', photo_url: null, sort_order: 0 },
    ] as never)

    const { container } = render(await LeLogementPage())
    const activePanel = () => screen.getByTestId('lodging-pager-panel')

    expect(container.querySelectorAll('[data-testid="lodging-pager-panel"]')).toHaveLength(1)
    expect(activePanel()).toHaveTextContent('Chalet MyStay')
    expect(activePanel()).toHaveTextContent('Bienvenue au chalet')
    expect(within(activePanel()).getByAltText('Présentation du logement')).toHaveAttribute('src', 'https://cdn.test/chalet.webp')
    expect(activePanel()).not.toHaveTextContent('Réseau Wi-Fi')
    expect(activePanel()).not.toHaveTextContent('Poubelles')
    expect(activePanel()).not.toHaveTextContent('Départ')

    await user.click(screen.getByRole('button', { name: /aller à infos pratiques/i }))

    expect(activePanel()).toHaveTextContent('Adresse')
    expect(activePanel()).toHaveTextContent('Réseau Wi-Fi')
    expect(activePanel()).not.toHaveTextContent('Poubelles')
    expect(activePanel()).not.toHaveTextContent('Départ')

    const secondPage = within(activePanel())
    const addressHeading = secondPage.getByRole('heading', { name: 'Adresse' })
    const wifiHeading = secondPage.getByRole('heading', { name: 'Réseau Wi-Fi' })

    expect(addressHeading.compareDocumentPosition(wifiHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )

    await user.click(screen.getByRole('button', { name: /aller à bon à savoir/i }))

    expect(activePanel()).toHaveTextContent('Infos locales')
    expect(activePanel()).not.toHaveTextContent('Départ')
    expect(activePanel()).not.toHaveTextContent('Poubelles')

    await user.click(screen.getByRole('button', { name: /aller à départ & consignes/i }))

    expect(activePanel()).toHaveTextContent('Départ')
    expect(activePanel()).toHaveTextContent('Poubelles')
    expect(activePanel()).not.toHaveTextContent('Infos locales')

    const departurePage = within(activePanel())
    const checkoutHeading = departurePage.getByRole('heading', { name: 'Départ' })
    const trashHeading = departurePage.getByRole('heading', { name: 'Poubelles' })

    expect(checkoutHeading.compareDocumentPosition(trashHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('keeps the four-page lodging guide even when only practical fixed sections exist', async () => {
    const user = userEvent.setup()
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    const { container } = render(await LeLogementPage())

    expect(container.querySelectorAll('[data-testid="lodging-pager-panel"]')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /aller à infos pratiques/i }))
    expect(screen.getByTestId('lodging-pager-panel')).toHaveTextContent('1 rue des Alpes')
    expect(screen.getByText('1 rue des Alpes')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /aller à/i })).toHaveLength(4)
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

  it('renders the emergency number as a large visual element', async () => {
    const user = userEvent.setup()
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: null,
      cover_photo_url: null,
      presentation_video_url: null,
      lodging_address: null,
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: '112', useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    render(await LeLogementPage())
    await user.click(screen.getByRole('button', { name: /aller à infos pratiques/i }))

    const emergencyNumber = screen.getByText('112')
    expect(emergencyNumber).toHaveAttribute('data-testid', 'lodging-emergency-number')
    expect(emergencyNumber).toHaveClass('text-[64px]')
    expect(emergencyNumber.parentElement?.className).not.toContain('[&_p]:!text-[13px]')
  })
})
