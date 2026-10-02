/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { GuideNavigation } from '@/features/guide-app/components/GuideNavigation'
import { GuideStayHome } from '@/features/guide-app/components/stay/GuideStayHome'
import { GuideWifiSheet } from '@/features/guide-app/components/stay/GuideWifiSheet'
import { GuideHelpView } from '@/features/guide-app/components/stay/GuideHelpView'
import { buildStayLodging, buildStayPoi } from '../support/guide-stay-lodging'

describe('054 US-01 — stay home, navigation, Wi-Fi and help', () => {
  it('AC-01-01: shows four equal tabs Séjour · Guide · Carte · Aide', () => {
    const onNavigate = jest.fn()
    render(<GuideNavigation activeView="home" onNavigate={onNavigate} />)

    const nav = screen.getByRole('navigation', { name: /navigation du guide/i })
    const tabs = within(nav).getAllByRole('button')
    expect(tabs.map(tab => tab.textContent)).toEqual(['Séjour', 'Guide', 'Carte', 'Aide'])
    expect(tabs[0]).toHaveAttribute('aria-current', 'page')

    fireEvent.click(tabs[1])
    fireEvent.click(tabs[2])
    fireEvent.click(tabs[3])
    expect(onNavigate.mock.calls.map(call => call[0])).toEqual(['favorites', 'map', 'help'])
  })

  it('AC-01-01: highlights Séjour on stay screens and Aide on the contact view', () => {
    const { rerender } = render(<GuideNavigation activeView="arrival" onNavigate={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Séjour' })).toHaveAttribute('aria-current', 'page')
    rerender(<GuideNavigation activeView="contact" onNavigate={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Aide' })).toHaveAttribute('aria-current', 'page')
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

    expect(screen.getByText('Votre guide de séjour')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenue au 305' })).toBeInTheDocument()
    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    const stats = screen.getByTestId('guide-stay-stats')
    expect(within(stats).getByText('4')).toBeInTheDocument()
    expect(within(stats).getByText('Voyageurs')).toBeInTheDocument()
    expect(within(stats).getByText('52 m²')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /arrivée.*dès 16 h/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /départ.*1 sur 2 faits/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /arrivée/i }))
    fireEvent.click(screen.getByRole('button', { name: /guide logement/i }))
    fireEvent.click(screen.getByRole('button', { name: /départ/i }))
    fireEvent.click(screen.getByRole('button', { name: /wi-fi/i }))
    expect(onNavigate.mock.calls.map(call => call[0])).toEqual(['arrival', 'rules', 'departure'])
    expect(onOpenWifi).toHaveBeenCalled()
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
    fireEvent.click(screen.getByRole('button', { name: 'Tout voir' }))
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
    expect(screen.getByRole('button', { name: 'Copié ✓' })).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(1800) })
    expect(screen.getByRole('button', { name: 'Copier le mot de passe' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('guide-wifi-sheet-backdrop'))
    expect(onClose).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('AC-01-05: the help tab shows the concierge, emergency and address blocks', () => {
    const onWrite = jest.fn()
    render(<GuideHelpView lodging={buildStayLodging()} onWrite={onWrite} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Aide' })).toBeInTheDocument()
    expect(screen.getByText('Conciergerie MyStay')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Écrire' }))
    expect(onWrite).toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: /appeler/i })).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: /112/ })).toHaveAttribute('href', 'tel:112')
    expect(screen.getByText(/305 route du Bettex/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ouvrir dans Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=45.89,6.71',
    )
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
