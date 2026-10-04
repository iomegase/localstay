/** @jest-environment jsdom */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideHelpView } from '@/features/guide-app/components/stay/GuideHelpView'
import { GuideInstallCard } from '@/features/guide-pwa/components/GuideInstallCard'
import { resetInstallPromptForTests, startInstallPromptCapture } from '@/features/guide-pwa/hooks/useGuideInstall'
import { buildStayLodging } from '../support/guide-stay-lodging'

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPHONE_INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0'
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'
const IPHONE_EDGE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/130.0 Mobile/15E148 Safari/605.1.15'
const IPHONE_FIREFOX = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15'
const ANDROID_FIREFOX = 'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'

function setEnvironment({ userAgent, standalone = false, brave = false }: { userAgent: string; standalone?: boolean; brave?: boolean }) {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: userAgent })
  Object.defineProperty(window.navigator, 'brave', { configurable: true, value: brave ? { isBrave: async () => true } : undefined })
  Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, value: 5 })
  window.matchMedia = jest.fn((query: string) => ({
    matches: standalone && query.includes('standalone'),
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia
}

function fireInstallPrompt(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: jest.Mock
    userChoice: Promise<{ outcome: string }>
  }
  event.prompt = jest.fn(async () => undefined)
  event.userChoice = Promise.resolve({ outcome })
  act(() => { window.dispatchEvent(event) })
  return event
}

function renderPrivateHelp() {
  const lodging = buildStayLodging()
  return render(<GuideHelpView lodging={lodging} installCard={<GuideInstallCard lodgingId={lodging.id} />} />)
}

beforeEach(() => {
  window.localStorage.clear()
  resetInstallPromptForTests()
  startInstallPromptCapture()
})

it('AC-01-03: ouvre l’invite native sur Android puis affiche le guide installé', async () => {
  setEnvironment({ userAgent: ANDROID_CHROME })
  const user = userEvent.setup()
  renderPrivateHelp()
  const event = fireInstallPrompt('accepted')
  expect(event.defaultPrevented).toBe(true)

  await user.click(screen.getByRole('button', { name: 'Installer le guide' }))
  expect(event.prompt).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('Guide installé')).toBeInTheDocument())
  expect(screen.queryByRole('button', { name: 'Installer le guide' })).not.toBeInTheDocument()
})

it('AC-01-03: garde le bouton si le voyageur refuse l’invite native', async () => {
  setEnvironment({ userAgent: ANDROID_CHROME })
  const user = userEvent.setup()
  renderPrivateHelp()
  fireInstallPrompt('dismissed')
  await user.click(screen.getByRole('button', { name: 'Installer le guide' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Installer le guide' })).toBeInTheDocument())
})

it('AC-01-04: explique les 3 étapes iOS dans un modal accessible', async () => {
  setEnvironment({ userAgent: IPHONE_SAFARI })
  const user = userEvent.setup()
  renderPrivateHelp()
  const trigger = screen.getByRole('button', { name: 'Installer le guide' })
  await user.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Installer le guide' })
  const steps = dialog.querySelectorAll('ol > li')
  expect(steps).toHaveLength(3)
  expect(steps[0]).toHaveTextContent('Touchez « Partager » (dans Safari : barre du bas ; dans Brave : menu « ⋯ »)')
  expect(steps[1]).toHaveTextContent('Sur l’écran d’accueil')
  expect(steps[2]).toHaveTextContent('Ajouter')
  expect(dialog).toHaveTextContent('Fonctionne avec Safari, Brave, Chrome, Edge et Firefox.')
  expect(dialog).toHaveTextContent('Le guide reste disponible 7 jours, même sans réseau.')
  await user.click(screen.getByRole('button', { name: 'J’ai compris' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
})

it.each([
  ['Brave', IPHONE_SAFARI, true, 'Touchez le menu « ⋯ », puis « Partager »'],
  ['Chrome', IPHONE_CHROME, false, 'Touchez « Partager » dans la barre d’adresse'],
  ['Edge', IPHONE_EDGE, false, 'Touchez le menu « ⋯ », puis « Partager »'],
  ['Firefox', IPHONE_FIREFOX, false, 'Touchez le menu « ☰ », puis « Partager »'],
])('A1 AC-01-04: première étape adaptée à %s sur iPhone', async (_name, userAgent, brave, firstStep) => {
  setEnvironment({ userAgent, brave })
  const user = userEvent.setup()
  renderPrivateHelp()
  await user.click(screen.getByRole('button', { name: 'Installer le guide' }))
  const steps = screen.getByRole('dialog', { name: 'Installer le guide' }).querySelectorAll('ol > li')
  expect(steps[0]).toHaveTextContent(firstStep)
  expect(steps[1]).toHaveTextContent('Sur l’écran d’accueil')
})

it('A1 AC-01-07: Android sans invite native → menu « ⋮ »', async () => {
  setEnvironment({ userAgent: ANDROID_FIREFOX })
  const user = userEvent.setup()
  renderPrivateHelp()
  await user.click(screen.getByRole('button', { name: 'Installer le guide' }))
  expect(screen.getByRole('dialog', { name: 'Installer le guide' }))
    .toHaveTextContent('Ouvrez le menu « ⋮ » de votre navigateur, puis « Installer » ou « Ajouter à l’écran d’accueil ».')
})

it('AC-01-05: invite à ouvrir Safari ou Chrome depuis un navigateur intégré', async () => {
  setEnvironment({ userAgent: IPHONE_INSTAGRAM })
  const user = userEvent.setup()
  renderPrivateHelp()
  await user.click(screen.getByRole('button', { name: 'Installer le guide' }))
  expect(screen.getByRole('dialog', { name: 'Installer le guide' }))
    .toHaveTextContent('Ouvrez le guide dans Safari (iPhone) ou Chrome (Android) pour l’installer.')
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('AC-01-06: en mode installé, la carte indique la date de fin et n’est plus un bouton', () => {
  setEnvironment({ userAgent: IPHONE_SAFARI, standalone: true })
  window.localStorage.setItem('mystay:pwa:lodging-1', JSON.stringify({ startedAt: '2026-10-04T10:00:00.000Z' }))
  renderPrivateHelp()
  expect(screen.getByText('Guide installé')).toBeInTheDocument()
  expect(screen.getByText('Disponible jusqu’au 11 octobre')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Installer le guide' })).not.toBeInTheDocument()
})
