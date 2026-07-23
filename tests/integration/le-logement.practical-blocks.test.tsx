/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import LeLogementPage from '@/app/(public)/le-logement/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Le 305',
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
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

describe('/le-logement — guide vertical', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders all four sections and maps the complete lodging content', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: 'Bienvenue chez vous ♡',
      cover_photo_url: 'https://cdn.test/le-305.webp',
      presentation_video_url: 'https://youtu.be/dQw4w9WgXcQ',
      lodging_address: '1 rue des Alpes, 74170 Saint-Gervais-les-Bains',
      wifi_ssid: 'MyStay-305',
      wifi_password: 'secret-wifi',
      parking_info: 'Place 12 dans la cour.',
      parking_photo_url: null,
      parking_video_url: null,
      equipment_info: 'Cheminée et chauffage au sol.',
      checkout_instructions: '- Vider le réfrigérateur\n- Fermer les fenêtres',
      trash_location: 'Point tri en bas du bâtiment',
      trash_bins: [{ type: 'jaune' }, { type: 'verre' }],
      house_rules: 'Merci de respecter le calme.',
      emergency_contacts: '112',
      useful_services: 'Conciergerie disponible.',
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Le local à skis', body: 'Au **rez-de-chaussée**.', icon: 'star', photo_url: 'https://cdn.test/skis.webp', video_url: null, sort_order: 0 },
    ] as never)

    const { container } = render(await LeLogementPage())
    const welcome = container.querySelector('#bienvenue')
    const practical = container.querySelector('#infos-pratiques')
    const knowledge = container.querySelector('#bon-a-savoir')
    const departure = container.querySelector('#depart')

    expect(welcome).not.toBeNull()
    expect(practical).not.toBeNull()
    expect(knowledge).not.toBeNull()
    expect(departure).not.toBeNull()
    expect(welcome?.compareDocumentPosition(practical as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(practical?.compareDocumentPosition(knowledge as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(knowledge?.compareDocumentPosition(departure as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(container.querySelector('[data-testid="lodging-pager-panel"]')).not.toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 1, name: 'Le 305' })).toBeInTheDocument()
    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(screen.getByAltText('Le 305')).toHaveAttribute('src', 'https://cdn.test/le-305.webp')
    expect(screen.queryAllByText('Bienvenue chez vous ♡')).toHaveLength(0)
    expect(screen.queryByTestId('lodging-welcome-message')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Votre séjour commence ici' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Préparer mon arrivée/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Découvrir le logement/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Anticiper mon départ/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voir l’itinéraire/i })).toHaveAttribute('href', expect.stringContaining('google.com/maps'))

    expect(within(screen.getByTestId('arrival-fact')).getByText('À partir de 16 h')).toBeInTheDocument()
    expect(within(screen.getByTestId('departure-fact')).getByText('10 h')).toBeInTheDocument()
    expect(screen.queryByText('Wi-Fi')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Réseau Wi-Fi' })).toBeInTheDocument()
    expect(screen.getByText('MyStay-305')).toBeInTheDocument()
    expect(screen.getByText('secret-wifi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lire la vidéo : Vidéo du logement' })).toBeInTheDocument()
    expect(screen.getByText('Place 12 dans la cour.')).toBeInTheDocument()
    expect(screen.getByText('Cheminée et chauffage au sol.')).toBeInTheDocument()
    expect(screen.getByText('Le local à skis')).toBeInTheDocument()
    expect(screen.getByAltText('Le local à skis')).toHaveAttribute('src', 'https://cdn.test/skis.webp')
    expect(screen.getByRole('checkbox', { name: 'Vider le réfrigérateur' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Poubelles' })).toBeInTheDocument()
    expect(screen.getByTestId('lodging-emergency-number')).toHaveTextContent('112')
  })

  it('omits optional cards instead of fabricating owner content', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: null,
      cover_photo_url: null,
      presentation_video_url: null,
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null,
      wifi_password: null,
      parking_info: null,
      equipment_info: null,
      checkout_instructions: null,
      trash_location: null,
      trash_bins: [],
      house_rules: null,
      emergency_contacts: null,
      useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    render(await LeLogementPage())

    expect(screen.getByText('1 rue des Alpes')).toBeInTheDocument()
    expect(screen.queryByText('Réseau Wi-Fi')).not.toBeInTheDocument()
    expect(screen.queryByText('Parking')).not.toBeInTheDocument()
    expect(screen.queryByText('Votre checklist')).not.toBeInTheDocument()
    expect(screen.queryByText(/Aucune information renseignée dans cette section/i)).not.toBeInTheDocument()
  })

  it('treats custom practical blocks as page content', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Bons plans', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 0 },
    ] as never)

    render(await LeLogementPage())

    expect(screen.getByText('Bons plans')).toBeInTheDocument()
    expect(screen.queryByText(/n'ont pas encore été renseignées/i)).not.toBeInTheDocument()
  })
})
