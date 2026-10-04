/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'
import { GuidePwaRuntime } from '@/features/guide-pwa/components/GuidePwaRuntime'

const LODGING_ID = '11111111-1111-4111-8111-111111111111'
const KEY = `mystay:pwa:${LODGING_ID}`

const postMessage = jest.fn()
const register = jest.fn(async () => ({}))
const deleteCache = jest.fn(async () => true)

function setEnvironment({ standalone, search = '' }: { standalone: boolean; search?: string }) {
  window.matchMedia = jest.fn((query: string) => ({
    matches: standalone && query.includes('standalone'),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
  window.history.replaceState(null, '', `/sejour${search}`)
}

beforeEach(() => {
  window.localStorage.clear()
  postMessage.mockClear()
  register.mockClear()
  deleteCache.mockClear()
  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: { register, ready: Promise.resolve({ active: { postMessage } }) },
  })
  Object.defineProperty(window, 'caches', { configurable: true, value: { delete: deleteCache } })
  jest.useFakeTimers({ now: new Date('2026-10-04T10:00:00.000Z'), doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
})

afterEach(() => jest.useRealTimers())

function renderGuide() {
  return render(<GuidePwaRuntime lodgingId={LODGING_ID}><p>Wi-Fi : neige-2026</p></GuidePwaRuntime>)
}

it('enregistre le service worker du guide', async () => {
  setEnvironment({ standalone: false })
  renderGuide()
  await waitFor(() => expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' }))
})

it('AC-03-01 + AC-02-01: première ouverture installée → date de début et pré-cache du séjour', async () => {
  setEnvironment({ standalone: true, search: `?lodging=${LODGING_ID}&source=pwa` })
  renderGuide()
  expect(await screen.findByText('Wi-Fi : neige-2026')).toBeVisible()
  expect(JSON.parse(window.localStorage.getItem(KEY) ?? '{}')).toEqual({ startedAt: '2026-10-04T10:00:00.000Z' })
  await waitFor(() => expect(postMessage).toHaveBeenCalledWith({ type: 'PRECACHE_GUIDE', lodgingId: LODGING_ID }))
})

it('AC-03-02: après 7 jours, affiche « séjour terminé », masque le séjour et vide le cache', async () => {
  window.localStorage.setItem(KEY, JSON.stringify({ startedAt: '2026-09-27T10:00:00.000Z' }))
  setEnvironment({ standalone: true })
  renderGuide()
  expect(await screen.findByText('Votre séjour est terminé.')).toBeInTheDocument()
  expect(screen.getByText('Pour un nouveau séjour, scannez le QR code du logement.')).toBeInTheDocument()
  expect(screen.queryByText('Wi-Fi : neige-2026')).not.toBeInTheDocument()
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  await waitFor(() => expect(deleteCache).toHaveBeenCalledWith('mystay-guide-v1'))
  expect(postMessage).toHaveBeenCalledWith({ type: 'CLEAR_GUIDE' })
  expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'PRECACHE_GUIDE' }))
})

it('AC-03-02: encore valide au 6ᵉ jour', async () => {
  window.localStorage.setItem(KEY, JSON.stringify({ startedAt: '2026-09-28T10:00:01.000Z' }))
  setEnvironment({ standalone: true })
  renderGuide()
  expect(await screen.findByText('Wi-Fi : neige-2026')).toBeInTheDocument()
  expect(screen.queryByText('Votre séjour est terminé.')).not.toBeInTheDocument()
})

it('AC-03-04: une entrée QR dans le navigateur efface la date de début du logement', async () => {
  window.localStorage.setItem(KEY, JSON.stringify({ startedAt: '2026-01-01T10:00:00.000Z' }))
  setEnvironment({ standalone: false, search: `?lodging=${LODGING_ID}` })
  renderGuide()
  await waitFor(() => expect(window.localStorage.getItem(KEY)).toBeNull())
  expect(screen.getByText('Wi-Fi : neige-2026')).toBeInTheDocument()
})

it('AC-03-04: l’ouverture de l’app installée (source=pwa) ne réinitialise rien', async () => {
  window.localStorage.setItem(KEY, JSON.stringify({ startedAt: '2026-10-01T10:00:00.000Z' }))
  setEnvironment({ standalone: true, search: `?lodging=${LODGING_ID}&source=pwa` })
  renderGuide()
  await screen.findByText('Wi-Fi : neige-2026')
  expect(JSON.parse(window.localStorage.getItem(KEY) ?? '{}').startedAt).toBe('2026-10-01T10:00:00.000Z')
})

it('BR-04: dans le navigateur, aucune expiration ni pré-cache', async () => {
  window.localStorage.setItem(KEY, JSON.stringify({ startedAt: '2026-01-01T10:00:00.000Z' }))
  setEnvironment({ standalone: false })
  renderGuide()
  expect(await screen.findByText('Wi-Fi : neige-2026')).toBeInTheDocument()
  await waitFor(() => expect(register).toHaveBeenCalled())
  expect(postMessage).not.toHaveBeenCalled()
})
