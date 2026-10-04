/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideI18nProvider } from '@/features/guide-i18n/components/GuideI18nProvider'
import { GuideHeader } from '@/features/guide-app/components/GuideHeader'
import { GuideNavigation } from '@/features/guide-app/components/GuideNavigation'
import { GuideHelpView } from '@/features/guide-app/components/stay/GuideHelpView'
import { GuideDepartureView } from '@/features/guide-app/components/stay/GuideDepartureView'
import { buildStayLodging } from '../support/guide-stay-lodging'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: jest.fn() }) }))

const fetchMock = jest.fn(async () => ({ ok: true }) as Response)

beforeEach(() => {
  refresh.mockClear()
  fetchMock.mockClear()
  global.fetch = fetchMock as unknown as typeof fetch
  document.documentElement.lang = 'fr'
})

function renderGuide(initialLocale: 'fr' | 'en') {
  return render(
    <GuideI18nProvider initialLocale={initialLocale}>
      <GuideHeader onOpenHome={jest.fn()} onOpenMenu={jest.fn()} localeSwitch />
      <GuideNavigation activeView="help" onNavigate={jest.fn()} />
      <GuideHelpView lodging={buildStayLodging()} />
    </GuideI18nProvider>,
  )
}

it('AC-01-01 / AC-01-06: sélecteur FR | GB accessible dans l’en-tête', () => {
  renderGuide('fr')
  const group = screen.getByRole('radiogroup', { name: 'Langue du guide' })
  const fr = screen.getByRole('radio', { name: 'Français' })
  const en = screen.getByRole('radio', { name: 'English' })
  expect(group).toContainElement(fr)
  expect(fr).toHaveTextContent('FR')
  expect(en).toHaveTextContent('GB')
  expect(fr).toHaveAttribute('aria-checked', 'true')
  expect(en).toHaveAttribute('aria-checked', 'false')
})

it('AC-01-02: toucher GB bascule toute l’interface sans rechargement et mémorise le choix', async () => {
  const user = userEvent.setup()
  renderGuide('fr')
  expect(screen.getByRole('heading', { name: 'Réglages et infos' })).toBeInTheDocument()

  await user.click(screen.getByRole('radio', { name: 'English' }))

  expect(screen.getByRole('heading', { name: 'Settings & info' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Guide navigation' })).toBeInTheDocument()
  expect(screen.getByText('Practical info')).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true')
  expect(fetchMock).toHaveBeenCalledWith('/api/guide/locale', expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify({ locale: 'en' }),
  }))
  await act(async () => { await Promise.resolve() })
  expect(refresh).toHaveBeenCalled()
  expect(document.documentElement.lang).toBe('en')
})

it('AC-01-06: les flèches du clavier changent de langue', () => {
  renderGuide('en')
  fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' })
  expect(screen.getByRole('radio', { name: 'Français' })).toHaveAttribute('aria-checked', 'true')
})

it('AC-01-04: rendu directement dans la langue initiale, conteneur avec lang', () => {
  const { container } = renderGuide('en')
  expect(screen.getByRole('heading', { name: 'Settings & info' })).toBeInTheDocument()
  expect(container.querySelector('[lang="en"]')).not.toBeNull()
})

it('AC-01-05: les consignes fixes de départ sont traduites, le texte de l’hôte reste en français', () => {
  render(
    <GuideI18nProvider initialLocale="en">
      <GuideDepartureView
        lodging={buildStayLodging({ departureInstructions: ['Laisser les draps en place sur les lits.', 'Fermer les volets'] })}
        checked={new Set()}
        onToggle={jest.fn()}
        departed={false}
        onDeparted={jest.fn(async () => undefined)}
        onBack={jest.fn()}
      />
    </GuideI18nProvider>,
  )
  expect(screen.getByText('Leave the sheets on the beds.')).toBeInTheDocument()
  expect(screen.getByText('Fermer les volets')).toBeInTheDocument()
  expect(screen.getByText('0 of 2 done')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: "I've left" })).toBeInTheDocument()
})
