/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { GuideArrivalFlow } from '@/features/guide-app/components/stay/GuideArrivalFlow'
import { buildStayLodging } from '../support/guide-stay-lodging'

jest.mock('@/features/guide-app/components/GuideDarkMarkdown', () => ({
  GuideDarkMarkdown: ({ source }: { source: string }) => <div data-testid="guide-markdown">{source}</div>,
}))

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
    // PO 2026-10-06 : bouton sous l'adresse, aligné à droite, icône épingle.
    expect(screen.getByTestId('arrival-address').nextElementSibling).toContainElement(mapsLink)
    expect(mapsLink.parentElement).toHaveClass('justify-end')
    expect(mapsLink.querySelector('svg')).toHaveClass('lucide-map-pin')
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

  it('AC-02-03 (amendé 2026-10-06) : code toujours affiché, « Je suis arrivé·e ! » dans la carte du code', () => {
    renderFlow()
    fireEvent.click(screen.getAllByRole('tab')[1])

    expect(screen.getByText('Code de la boîte à clés')).toBeInTheDocument()
    expect(screen.getByTestId('guide-key-box-code')).toHaveTextContent('4810')
    expect(screen.queryByRole('button', { name: 'Afficher le code' })).not.toBeInTheDocument()
    const arrivedButtons = screen.getAllByRole('button', { name: 'Je suis arrivé·e !' })
    expect(arrivedButtons).toHaveLength(1)
    expect(screen.getByTestId('guide-key-box-card')).toContainElement(arrivedButtons[0]!)
  })

  it('PO 2026-10-06 : le code passe sous les sous-étapes, texte centré verticalement sur le chiffre', () => {
    renderFlow()
    fireEvent.click(screen.getAllByRole('tab')[1])

    const card = screen.getByTestId('guide-key-box-card')
    const substep = screen.getAllByTestId('arrival-substep')[0]!
    expect(substep.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(substep).toHaveClass('items-center')
    expect(within(substep).getByText('1')).toHaveClass('leading-none')
  })

  it('PO 2026-10-06 : le markdown est interprété dans les sous-étapes et le conseil', () => {
    const base = buildStayLodging()
    const lodging = buildStayLodging({
      arrivalInstructions: base.arrivalInstructions.map(step => step.kind === 'access'
        ? { ...step, tip: 'Refermez **bien** le cache.', substeps: [{ title: 'Ouvrez la **boîte**', detail: 'À *gauche* de la porte.' }] }
        : step),
    })
    renderFlow({ lodging })
    fireEvent.click(screen.getAllByRole('tab')[1])

    // react-markdown est remplacé par un stub en test : on vérifie que ces textes passent par le rendu markdown du guide.
    const rendered = screen.getAllByTestId('guide-markdown').map(node => node.textContent)
    expect(rendered).toEqual(expect.arrayContaining(['Ouvrez la **boîte**', 'À *gauche* de la porte.', 'Refermez **bien** le cache.']))
  })

  it('PO 2026-10-06 : le texte des repères est centré dans leur case', () => {
    renderFlow()
    fireEvent.click(screen.getAllByRole('tab')[2])
    const fact = screen.getAllByTestId('arrival-fact')[0]!
    expect(fact).toHaveClass('items-center', 'justify-center', 'text-center')
    expect(fact).toHaveTextContent('−2')
  })

  it('sans code, le bouton « Je suis arrivé·e ! » reste sous l’étape', () => {
    renderFlow({ lodging: buildStayLodging({ keyBoxCode: null }) })
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getAllByRole('button', { name: 'Je suis arrivé·e !' })).toHaveLength(1)
    expect(screen.queryByTestId('guide-key-box-card')).not.toBeInTheDocument()
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
