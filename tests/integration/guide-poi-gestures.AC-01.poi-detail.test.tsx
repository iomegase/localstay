/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { GuidePoiDetails } from '@/features/guide-app/components/GuidePoiDetails'
import { buildStayLodging, buildStayPoi } from '../support/guide-stay-lodging'

jest.mock('@/features/geolocation/hooks/useUserLocation', () => ({
  useUserLocation: () => ({ location: null, status: 'idle', requestLocation: jest.fn(), clearLocation: jest.fn() }),
}))

const PHOTOS = ['/p1.jpg', '/p2.jpg', '/p3.jpg']

function renderDetails(onBack = jest.fn()) {
  render(
    <GuidePoiDetails
      mode="private"
      poi={buildStayPoi({ name: 'La Ferme de Cupelin', photos: PHOTOS })}
      lodging={buildStayLodging()}
      onBack={onBack}
      onShowOnMap={jest.fn()}
    />,
  )
  return onBack
}

function swipe(target: Element, from: { x: number; y: number }, to: { x: number; y: number }) {
  fireEvent.touchStart(target, { touches: [{ clientX: from.x, clientY: from.y }] })
  fireEvent.touchMove(target, { touches: [{ clientX: (from.x + to.x) / 2, clientY: (from.y + to.y) / 2 }] })
  fireEvent.touchMove(target, { touches: [{ clientX: to.x, clientY: to.y }] })
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: to.x, clientY: to.y }] })
}

function currentPhotoIndex() {
  const dots = screen.getAllByLabelText(/^Photo \d sur 3$/)
  return dots.findIndex(dot => dot.getAttribute('aria-current') === 'true')
}

const hero = () => screen.getByTestId('poi-detail-hero-carousel')

it('AC-01-01: glisser à gauche / à droite sur la photo change de photo', () => {
  renderDetails()
  expect(currentPhotoIndex()).toBe(0)
  swipe(hero(), { x: 300, y: 200 }, { x: 200, y: 205 })
  expect(currentPhotoIndex()).toBe(1)
  swipe(hero(), { x: 200, y: 200 }, { x: 300, y: 195 })
  expect(currentPhotoIndex()).toBe(0)
  swipe(hero(), { x: 200, y: 200 }, { x: 300, y: 195 })
  expect(currentPhotoIndex()).toBe(2)
})

it('AC-01-01: un glisser trop court ne change rien', () => {
  renderDetails()
  swipe(hero(), { x: 300, y: 200 }, { x: 270, y: 200 })
  expect(currentPhotoIndex()).toBe(0)
})

it('AC-01-02: flèches masquées sur écran tactile, visibles à la souris', () => {
  renderDetails()
  for (const name of ['Photo précédente', 'Photo suivante']) {
    const arrow = screen.getByRole('button', { name, hidden: true })
    expect(arrow.className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(arrow.className).toContain('[@media(pointer:fine)]:flex')
  }
})

it('AC-01-03: glisser depuis le bord gauche ferme la fiche, sans changer de photo', () => {
  const onBack = renderDetails()
  swipe(hero(), { x: 10, y: 200 }, { x: 120, y: 210 })
  expect(onBack).toHaveBeenCalledTimes(1)
  expect(currentPhotoIndex()).toBe(0)
})

it('AC-01-03: un retour depuis le bord trop court remet la fiche en place', () => {
  const onBack = renderDetails()
  const article = screen.getByRole('article')
  fireEvent.touchStart(hero(), { touches: [{ clientX: 10, clientY: 200 }] })
  fireEvent.touchMove(hero(), { touches: [{ clientX: 60, clientY: 200 }] })
  expect(article.style.transform).toBe('translate3d(50px, 0px, 0)')
  fireEvent.touchEnd(hero(), { changedTouches: [{ clientX: 60, clientY: 200 }] })
  expect(onBack).not.toHaveBeenCalled()
  expect(article.style.transform).toBe('')
})

it('AC-01-04: tirer la photo vers le bas, fiche en haut, ferme la fiche', () => {
  const onBack = renderDetails()
  swipe(hero(), { x: 200, y: 100 }, { x: 205, y: 260 })
  expect(onBack).toHaveBeenCalledTimes(1)
})

it('AC-01-04: pas de fermeture quand la fiche est défilée', () => {
  const onBack = jest.fn()
  render(
    <div data-testid="scroller" style={{ overflowY: 'auto' }}>
      <GuidePoiDetails mode="private" poi={buildStayPoi({ photos: PHOTOS })} lodging={buildStayLodging()} onBack={onBack} onShowOnMap={jest.fn()} />
    </div>,
  )
  const scroller = screen.getByTestId('scroller')
  scroller.scrollTop = 150
  swipe(hero(), { x: 200, y: 100 }, { x: 205, y: 260 })
  expect(onBack).not.toHaveBeenCalled()
})

it('AC-01-05: un défilement vertical vers le haut ne déclenche rien', () => {
  const onBack = renderDetails()
  swipe(hero(), { x: 200, y: 300 }, { x: 205, y: 100 })
  expect(onBack).not.toHaveBeenCalled()
  expect(currentPhotoIndex()).toBe(0)
})
