/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { GuideArrivalFlow } from '@/features/guide-app/components/stay/GuideArrivalFlow'
import { buildStayLodging } from '../support/guide-stay-lodging'

function renderFlow(overrides: Partial<Parameters<typeof GuideArrivalFlow>[0]> = {}) {
  const props = {
    lodging: buildStayLodging(),
    arrived: false,
    onArrived: jest.fn().mockResolvedValue(undefined),
    onBack: jest.fn(),
    ...overrides,
  }
  render(<GuideArrivalFlow {...props} />)
  return props
}

describe('054 US-02 — guided arrival', () => {
  it('AC-02-01: shows step tabs and the step card with facts, sub-steps and tip', () => {
    renderFlow()

    expect(screen.getByRole('heading', { level: 1, name: 'Arrivée' })).toBeInTheDocument()
    expect(screen.getByText('Dès 16 h')).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(tab => tab.textContent)).toEqual(['1Adresse', '2Logement', '3Garage'])
    expect(screen.queryByText(/Étape \d+ sur \d+/)).not.toBeInTheDocument()

    fireEvent.click(tabs[1])
    expect(screen.queryByText(/Étape \d+ sur \d+/)).not.toBeInTheDocument()
    expect(screen.getByText('Ouvrez la boîte')).toBeInTheDocument()
    expect(screen.getByText('À gauche de la porte.')).toBeInTheDocument()
    expect(screen.getByText('Infos')).toBeInTheDocument()
    expect(screen.getByText('Refermez bien le cache.')).toBeInTheDocument()

    fireEvent.click(tabs[2])
    expect(screen.getByText('Niveau')).toBeInTheDocument()
    expect(screen.getByText('−2')).toBeInTheDocument()
  })

  it('AC-02-02: the address step opens Maps and copies the address', async () => {
    jest.useFakeTimers()
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    renderFlow()

    const mapsLink = screen.getByRole('link', { name: 'Ouvrir dans Maps' })
    expect(mapsLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=45.89,6.71',
    )
    expect(screen.getByRole('tabpanel')).not.toContainElement(mapsLink)
    expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Étape suivante' })).not.toBeInTheDocument()
    const address = screen.getByTestId('arrival-address')
    expect(within(address).getByText('305 route du Bettex')).toBeInTheDocument()
    expect(within(address).getByText('74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
    const copyButton = within(address).getByRole('button', { name: "Copier l'adresse" })
    await act(async () => {
      fireEvent.click(copyButton)
    })
    expect(writeText).toHaveBeenCalledWith('305 route du Bettex, 74170 Saint-Gervais-les-Bains')
    expect(within(address).getByRole('button', { name: 'Adresse copiée' })).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(1600) })
    expect(within(address).getByRole('button', { name: "Copier l'adresse" })).toBeInTheDocument()
    jest.useRealTimers()
  })

  it('AC-02-03: the access step masks the key box code until revealed', () => {
    renderFlow()
    fireEvent.click(screen.getAllByRole('tab')[1])

    expect(screen.getByText('Code de la boîte à clés')).toBeInTheDocument()
    expect(screen.getByTestId('guide-key-box-code')).toHaveTextContent('••••')
    fireEvent.click(screen.getByRole('button', { name: 'Afficher le code' }))
    expect(screen.getByTestId('guide-key-box-code')).toHaveTextContent('4810')
    fireEvent.click(screen.getByRole('button', { name: 'Masquer' }))
    expect(screen.getByTestId('guide-key-box-code')).toHaveTextContent('••••')
  })

  it('AC-02-03: no key code block without a code', () => {
    renderFlow({ lodging: buildStayLodging({ keyBoxCode: null }) })
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.queryByText('Code de la boîte à clés')).not.toBeInTheDocument()
  })

  it('AC-02-04 / AC-03-01: step tabs and the arrival signal', async () => {
    const props = renderFlow()

    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.queryByText(/Étape \d+ sur \d+/)).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Je suis arrivé·e !' }))
    })
    expect(props.onArrived).toHaveBeenCalledTimes(1)
  })

  it('AC-03-01: shows the welcome confirmation once arrived', () => {
    renderFlow({ arrived: true })
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getByText('Bienvenue au 305 !')).toBeInTheDocument()
    expect(screen.getByText('La conciergerie a été prévenue de votre arrivée.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Je suis arrivé·e !' })).not.toBeInTheDocument()
  })

  it('AC-02-04: the last step has no redundant navigation buttons', () => {
    renderFlow()
    fireEvent.click(screen.getAllByRole('tab')[2])
    expect(screen.getByRole('button', { name: 'Revenir au séjour' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Étape suivante' })).not.toBeInTheDocument()
  })

  it('falls back to a single address step without instructions', () => {
    renderFlow({ lodging: buildStayLodging({ arrivalInstructions: [] }) })
    expect(screen.queryByText(/Étape \d+ sur \d+/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ouvrir dans Maps' })).toBeInTheDocument()
  })
})
