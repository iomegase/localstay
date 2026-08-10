/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    lodgingPublicProfile: { findFirst: jest.fn() },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

describe('/le-logement — guide en accordéons', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the mockup layout and maps the complete lodging content', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: 'Bienvenue chez vous ♡',
      cover_photo_url: 'https://cdn.test/le-305.webp',
      presentation_video_url: 'https://youtu.be/dQw4w9WgXcQ',
      lodging_address: '1 rue des Alpes, 74170 Saint-Gervais-les-Bains',
      wifi_ssid: 'MyStay-305',
      wifi_password: 'secret-wifi',
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
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue({
      max_guests: 4,
      bedroom_count: 2,
      surface_m2: 52,
    } as never)

    const { container } = render(await LeLogementPage())

    // Pas de chronologie 01/02/03/04 ni de navigation par sections
    expect(container.querySelector('#bienvenue')).toBeNull()
    expect(container.querySelector('#infos-pratiques')).toBeNull()
    expect(screen.queryByText('01')).not.toBeInTheDocument()
    expect(screen.queryByText('02')).not.toBeInTheDocument()

    // Hero + stats depuis le profil showcase
    expect(screen.getByRole('heading', { level: 1, name: 'Le 305' })).toBeInTheDocument()
    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(screen.getByAltText('Le 305')).toHaveAttribute('src', 'https://cdn.test/le-305.webp')
    expect(screen.getByText('Voyageurs')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Chambres')).toBeInTheDocument()
    expect(screen.getByText('52 m²')).toBeInTheDocument()

    // Le message d'accueil n'est pas affiché sur cette page
    expect(screen.queryAllByText('Bienvenue chez vous ♡')).toHaveLength(0)

    // Arrivée / Départ : informations non cliquables
    const arrival = screen.getByTestId('arrival-fact')
    const departure = screen.getByTestId('departure-fact')
    expect(arrival.tagName).toBe('DIV')
    expect(departure.tagName).toBe('DIV')
    expect(within(arrival).getByText('À partir de 16 h')).toBeInTheDocument()
    expect(within(departure).getByText('10 h')).toBeInTheDocument()

    // Accordéons (dont l'onglet Départ distinct des infos pratiques)
    expect(screen.getByRole('button', { name: /Accéder au logement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Découvrir le logement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Infos pratiques/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Départ/i })).toBeInTheDocument()

    // Le contenu de départ (checklist + tri) vit dans l'onglet Départ, pas dans Infos pratiques
    const departureAccordion = screen.getByRole('button', { name: /Départ/i }).closest('article') as HTMLElement
    expect(within(departureAccordion).getByRole('checkbox', {
      name: 'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
    })).toBeInTheDocument()
    expect(within(departureAccordion).getByRole('heading', { name: 'Poubelles' })).toBeInTheDocument()
    const practicalAccordion = screen.getByRole('button', { name: /Infos pratiques/i }).closest('article') as HTMLElement
    expect(within(practicalAccordion).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(practicalAccordion).getByTestId('lodging-emergency-number')).toHaveTextContent('112')

    // Contenu dynamique complet (présent dans le DOM même replié)
    expect(screen.getByText('1 rue des Alpes, 74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Réseau Wi-Fi' })).toBeInTheDocument()
    expect(screen.getByText('MyStay-305')).toBeInTheDocument()
    expect(screen.getByText('secret-wifi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lire la vidéo : Vidéo du logement' })).toBeInTheDocument()
    expect(screen.getByText('Le local à skis')).toBeInTheDocument()
    expect(screen.getByAltText('Le local à skis')).toHaveAttribute('src', 'https://cdn.test/skis.webp')
    expect(screen.getByRole('checkbox', {
      name: "Vérifier que vous n'avez rien oublié dans le logement.",
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Poubelles' })).toBeInTheDocument()
    expect(screen.getByTestId('lodging-emergency-number')).toHaveTextContent('112')

    // « Autour de vous » = lien direct vers les coups de cœur
    expect(screen.getByRole('link', { name: /Autour de vous/i })).toHaveAttribute('href', '/nos-recommandations')
  })

  it('opens a single accordion at a time', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      house_rules: 'Logement non-fumeur.',
      emergency_contacts: '112',
      trash_bins: [],
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue(null as never)

    const user = userEvent.setup()
    render(await LeLogementPage())

    const access = screen.getByRole('button', { name: /Accéder au logement/i })
    const discover = screen.getByRole('button', { name: /Découvrir le logement/i })

    await user.click(access)
    expect(access).toHaveAttribute('aria-expanded', 'true')
    await user.click(discover)
    expect(access).toHaveAttribute('aria-expanded', 'false')
    expect(discover).toHaveAttribute('aria-expanded', 'true')
  })

  it('omits optional cards instead of fabricating owner content', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      welcome_message: null,
      cover_photo_url: null,
      presentation_video_url: null,
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null,
      wifi_password: null,
      checkout_instructions: null,
      trash_location: null,
      trash_bins: [],
      house_rules: null,
      emergency_contacts: null,
      useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue(null as never)

    render(await LeLogementPage())

    expect(screen.getByText('1 rue des Alpes')).toBeInTheDocument()
    expect(screen.queryByText('Réseau Wi-Fi')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Découvrir le logement/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Règlement' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', {
      name: 'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
    })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', {
      name: "Vérifier que vous n'avez rien oublié dans le logement.",
    })).toBeInTheDocument()
    // Pas de stats sans profil showcase
    expect(screen.queryByText('Voyageurs')).not.toBeInTheDocument()
  })

  it('treats custom practical blocks as page content', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'Bons plans', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 0 },
    ] as never)
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue(null as never)

    render(await LeLogementPage())

    expect(screen.getByText('Bons plans')).toBeInTheDocument()
    expect(screen.queryByText(/n'ont pas encore été renseignées/i)).not.toBeInTheDocument()
  })
})
