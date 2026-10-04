/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { GuideNavigation } from '@/features/guide-app/components/GuideNavigation'
import { GuideStayHome } from '@/features/guide-app/components/stay/GuideStayHome'
import { GuideTransportRow } from '@/features/transport/components/GuideTransportRow'
import { GuideWifiSheet } from '@/features/guide-app/components/stay/GuideWifiSheet'
import { GuideHelpView } from '@/features/guide-app/components/stay/GuideHelpView'
import { buildStayLodging, buildStayPoi } from '../support/guide-stay-lodging'

describe('054 US-01 — stay home, navigation, Wi-Fi and help', () => {
  it('AC-01-01: shows four equal tabs Séjour · Guide · Carte · Aide', () => {
    const onNavigate = jest.fn()
    render(<GuideNavigation activeView="home" onNavigate={onNavigate} />)

    const nav = screen.getByRole('navigation', { name: /navigation du guide/i })
    const tabs = within(nav).getAllByRole('button')
    expect(tabs.map(tab => tab.textContent)).toEqual(['Accueil', '', 'Carte', ''])
    expect(tabs[0]).toHaveAttribute('aria-current', 'page')

    fireEvent.click(tabs[1])
    fireEvent.click(tabs[2])
    fireEvent.click(tabs[3])
    expect(onNavigate.mock.calls.map(call => call[0])).toEqual(['favorites', 'map', 'help'])
  })

  it('AC-01-01: keeps the heart accessible and moves the neutral indicator with the active tab', () => {
    const onNavigate = jest.fn()
    const { rerender } = render(<GuideNavigation activeView="home" onNavigate={onNavigate} />)
    const heart = screen.getByRole('button', { name: 'Coups de cœur' })
    expect(heart.textContent).toBe('')
    expect(heart.querySelector('svg.lucide-heart')).toBeInTheDocument()
    expect(heart.querySelector('svg')).not.toHaveClass('fill-current')
    expect(screen.getByTestId('guide-navigation-indicator')).toHaveClass('translate-x-0')
    fireEvent.click(heart)
    expect(onNavigate).toHaveBeenCalledWith('favorites')
    expect(screen.getByTestId('guide-navigation-indicator')).toHaveClass('translate-x-full')

    for (const [view, position] of [['poi', 'translate-x-full'], ['map', 'translate-x-[200%]'], ['contact', 'translate-x-[300%]']] as const) {
      rerender(<GuideNavigation activeView={view} onNavigate={onNavigate} />)
      expect(screen.getByTestId('guide-navigation-indicator')).toHaveClass(position)
    }
    rerender(<GuideNavigation activeView="favorites" onNavigate={onNavigate} />)
    expect(screen.getByRole('button', { name: 'Coups de cœur' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Coups de cœur' }).querySelector('svg')).toHaveClass('fill-current')
    const indicator = screen.getByTestId('guide-navigation-indicator')
    expect(indicator).toHaveAttribute('aria-hidden', 'true')
    expect(indicator).toHaveClass('motion-safe:transition-transform', 'motion-safe:[transition-duration:350ms]')
    expect(indicator.firstChild).toHaveClass('bg-slate-100', 'motion-safe:animate-guide-nav-droplet')
  })

  it('AC-01-01: highlights Séjour on stay screens and Aide on the contact view', () => {
    const { rerender } = render(<GuideNavigation activeView="arrival" onNavigate={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
    rerender(<GuideNavigation activeView="contact" onNavigate={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Réglages et infos' })).toHaveAttribute('aria-current', 'page')
  })

  it('AC-01-02: renders the hero, stats and the four tiles', () => {
    const onNavigate = jest.fn()
    const onOpenWifi = jest.fn()
    render(
      <GuideStayHome
        lodging={buildStayLodging()}
        pois={[]}
        departureDone={1}
        onNavigate={onNavigate}
        onOpenWifi={onOpenWifi}
        onOpenPoi={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenue au 305' })).toBeInTheDocument()
    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    const stats = screen.getByTestId('guide-stay-stats')
    expect(within(stats).getByText('4')).toBeInTheDocument()
    expect(within(stats).getByText('Voyageurs')).toBeInTheDocument()
    for (const label of ['Voyageurs', 'Chambres']) {
      const description = within(stats).getByText(label)
      expect(description).toHaveClass('sr-only')
      expect(description.closest('dt')?.querySelector('svg')).toBeInTheDocument()
      expect(description.closest('dl > div')).toHaveClass('flex-row-reverse', 'items-center', 'justify-center', 'text-center')
    }
    expect(within(stats).getByText('Surface')).toHaveClass('sr-only')
    expect(within(stats).getByText('Surface').closest('dt')?.querySelector('svg')).toBeNull()
    expect(within(stats).getByText('52 m²')).toBeInTheDocument()

    const arrival = screen.getByRole('button', { name: /arrivée.*dès 16 h/i })
    const departure = screen.getByRole('button', { name: /départ.*1 sur 2 faits/i })
    expect(arrival.querySelector('svg.lucide-log-in')).toBeInTheDocument()
    expect(departure.querySelector('svg.lucide-log-out')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /arrivée/i }))
    fireEvent.click(screen.getByRole('button', { name: /guide.*du logement/i }))
    fireEvent.click(screen.getByRole('button', { name: /départ/i }))
    fireEvent.click(screen.getByRole('button', { name: /wi-fi/i }))
    expect(onNavigate.mock.calls.map(call => call[0])).toEqual(['arrival', 'rules', 'departure'])
    expect(onOpenWifi).toHaveBeenCalled()
  })

  it('AC-01-02: aligns action cards and uses consistent tracking and icon sizes', () => {
    render(
      <GuideStayHome
        lodging={buildStayLodging({ presentationVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })}
        pois={[]}
        departureDone={0}
        onNavigate={jest.fn()}
        onOpenWifi={jest.fn()}
        onOpenPoi={jest.fn()}
        transportEntry={<GuideTransportRow onOpen={jest.fn()} />}
      />,
    )
    for (const name of [/arrivée/i, /wi-fi/i, /guide.*du logement/i, /départ/i, /se déplacer/i, /vidéo du logement/i]) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveClass('p-3', 'tracking-[-0.025em]')
      const icon = button.querySelector('svg')
      expect(icon).toHaveClass('h-7', 'w-7')
      expect(icon).toHaveAttribute('stroke-width', '1')
      expect(icon?.parentElement).toHaveClass('h-11', 'w-11', 'shrink-0')
      expect(icon?.parentElement?.parentElement).toHaveClass('gap-2.5')
    }
    expect(screen.getByRole('button', { name: /vidéo du logement/i }).querySelector('svg')?.parentElement).toHaveClass('rounded-[16px]', 'bg-[#EEF1F4]')
    for (const name of [/se déplacer/i, /vidéo du logement/i]) {
      const icons = screen.getByRole('button', { name }).querySelectorAll('svg')
      expect(icons[1]).toHaveClass('h-5', 'w-5')
    }
  })

  it('AC-01-02: hides unknown stats', () => {
    render(
      <GuideStayHome
        lodging={buildStayLodging({ stats: { guests: null, bedrooms: null, surfaceM2: null } })}
        pois={[]}
        departureDone={0}
        onNavigate={jest.fn()}
        onOpenWifi={jest.fn()}
        onOpenPoi={jest.fn()}
      />,
    )
    expect(screen.queryByTestId('guide-stay-stats')).not.toBeInTheDocument()
  })

  it('AC-01-03: shows the featured places carousel and « Tout voir » opens the Guide tab', () => {
    const onNavigate = jest.fn()
    const onOpenPoi = jest.fn()
    const poi = buildStayPoi()
    render(
      <GuideStayHome
        lodging={buildStayLodging()}
        pois={[poi]}
        departureDone={0}
        onNavigate={onNavigate}
        onOpenWifi={jest.fn()}
        onOpenPoi={onOpenPoi}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Nos coups de cœur' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Le Bettex' }))
    expect(onOpenPoi).toHaveBeenCalledWith(poi)
    fireEvent.click(screen.getByRole('button', { name: 'Voir tous les coups de cœur' }))
    expect(onNavigate).toHaveBeenCalledWith('favorites')
  })

  it('AC-01-04: the Wi-Fi sheet copies the password and closes on the backdrop', async () => {
    jest.useFakeTimers()
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const onClose = jest.fn()
    render(<GuideWifiSheet open name="Le305_5G" password="neige-2026" onClose={onClose} />)

    const sheet = screen.getByRole('dialog', { name: 'Wi-Fi' })
    expect(within(sheet).getByText('Le305_5G')).toBeInTheDocument()
    expect(within(sheet).getByText('neige-2026')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copier le mot de passe' }))
    })
    expect(writeText).toHaveBeenCalledWith('neige-2026')
    expect(within(sheet).getByRole('button', { name: 'Mot de passe copié' })).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(1800) })
    expect(screen.getByRole('button', { name: 'Copier le mot de passe' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('guide-wifi-sheet-backdrop'))
    expect(onClose).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('AC-01-05: the help tab shows the concierge and emergency without an address block', () => {
    render(<GuideHelpView lodging={buildStayLodging()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Réglages et infos' })).toBeInTheDocument()
    expect(screen.queryByText('Conciergerie MyStay')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Écrire' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /appeler/i })).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: /112/ })).toHaveAttribute('href', 'tel:112')
    expect(screen.queryByRole('heading', { name: 'Adresse' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ouvrir dans Maps' })).not.toBeInTheDocument()
  })

  it('054 AC-01-03: uses the photo cards with travel time and hides emergency and mobility places', () => {
    const onShowPoiOnMap = jest.fn()
    const cafe = buildStayPoi({ id: 'c1', name: 'Lulu', isOpenNow: true, category: { slug: 'cafes', name: 'Cafés', icon: 'coffee', color: '#000' } })
    const pharmacy = buildStayPoi({ id: 'u1', name: 'Pharmacie', category: { slug: 'urgences', name: 'Urgences', icon: 'cross', color: '#000' } })
    const taxi = buildStayPoi({ id: 'm1', name: 'Taxi Alpin', category: { slug: 'mobilite', name: 'Mobilité', icon: 'car', color: '#000' } })
    render(
      <GuideStayHome
        lodging={buildStayLodging()}
        pois={[cafe, pharmacy, taxi]}
        departureDone={0}
        travelTimes={{ c1: { walkingSeconds: 600, drivingSeconds: 200 } }}
        onNavigate={jest.fn()}
        onOpenWifi={jest.fn()}
        onOpenPoi={jest.fn()}
        onShowPoiOnMap={onShowPoiOnMap}
      />,
    )

    const carousel = screen.getByRole('region', { name: 'Nos coups de cœur' })
    const cards = within(carousel).getAllByTestId('favorite-bento-card')
    expect(cards).toHaveLength(1)
    expect(within(cards[0]).getByText('Ouvert')).toBeInTheDocument()
    expect(within(cards[0]).getByLabelText('À pied')).toBeInTheDocument()
    expect(within(cards[0]).getByText('10 min')).toBeInTheDocument()
    expect(within(carousel).queryByText('Pharmacie')).not.toBeInTheDocument()
    expect(within(carousel).queryByText('Taxi Alpin')).not.toBeInTheDocument()
    fireEvent.click(within(cards[0]).getByRole('button', { name: 'Voir Lulu sur la carte' }))
    expect(onShowPoiOnMap).toHaveBeenCalledWith(cafe)
  })
})
