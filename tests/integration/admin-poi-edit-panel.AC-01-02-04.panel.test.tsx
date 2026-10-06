/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminPoiPanel } from '@/features/admin-pois/components/AdminPoiPanel'
import { usePoiEditPanel } from '@/features/admin-pois/components/PoiEditPanelContext'

const mockBack = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, refresh: jest.fn(), push: jest.fn() }),
}))

// Spec 068 — panneau latéral d'édition.
const neighbors = {
  index: 2,
  total: 3,
  previousHref: '/admin/pois/a?city_id=c',
  nextHref: '/admin/pois/c?city_id=c',
}

const sections = [
  { id: 'poi-section-identite', label: 'Identité' },
  { id: 'poi-section-photos', label: 'Photos' },
]

function PhotoButton() {
  const { markDirty, markSaved } = usePoiEditPanel()
  return (
    <>
      <button type="button" onClick={markDirty}>Retirer la photo</button>
      <button type="button" onClick={markSaved}>Simuler enregistrement</button>
    </>
  )
}

function renderPanel(overrides: Partial<Parameters<typeof AdminPoiPanel>[0]> = {}) {
  return render(
    <AdminPoiPanel
      title="Blanc Sport"
      header={<p>En-tête de fiche</p>}
      neighbors={neighbors}
      sections={sections}
      {...overrides}
    >
      <label htmlFor="name">Nom</label>
      <input id="name" defaultValue="Blanc Sport" />
      <section id="poi-section-identite">Identité</section>
      <section id="poi-section-photos">Photos</section>
      <PhotoButton />
    </AdminPoiPanel>,
  )
}

describe('068 US-01 — ouverture du panneau', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-01-01 / BR-04 : dialogue accessible titré par le nom du POI', () => {
    renderPanel()

    const dialog = screen.getByRole('dialog', { name: 'Blanc Sport' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('En-tête de fiche')
  })

  it('AC-01-03 : panneau à droite, 760 px max sur desktop, plein écran sur mobile', () => {
    renderPanel()

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('right-0')
    expect(dialog.className).toContain('w-full')
    expect(dialog.className).toContain('lg:max-w-[760px]')
  })

  it('AC-01-04 : onglets qui font défiler jusqu’à la section', () => {
    const scrollIntoView = jest.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Photos' }))

    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.instances[0]).toBe(document.getElementById('poi-section-photos'))
  })
})

describe('068 US-02 — fermeture', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn(() => false)
  })

  it('AC-02-01 : Échap revient à la liste (historique)', () => {
    renderPanel()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('AC-02-01 : la croix revient à la liste', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('AC-02-02 : une saisie non enregistrée demande confirmation avant de fermer', () => {
    renderPanel()

    fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Blanc Sport Ski' } })
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(window.confirm).toHaveBeenCalledWith('Abandonner les modifications non enregistrées ?')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('AC-02-02 : une modification de photo (hors champ) compte aussi', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Retirer la photo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('AC-02-02 : après enregistrement, plus de confirmation', () => {
    renderPanel()

    fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Blanc Sport Ski' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simuler enregistrement' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(window.confirm).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('AC-02-02 : confirmer l’abandon ferme le panneau', () => {
    window.confirm = jest.fn(() => true)
    renderPanel()

    fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Blanc Sport Ski' } })
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(mockBack).toHaveBeenCalledTimes(1)
  })
})

describe('068 US-04 — Précédent / Suivant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn(() => false)
  })

  it('AC-04-01 : affiche la position et navigue sans empiler l’historique', () => {
    renderPanel()

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'POI suivant' }))
    expect(mockReplace).toHaveBeenCalledWith('/admin/pois/c?city_id=c', { scroll: false })

    fireEvent.click(screen.getByRole('button', { name: 'POI précédent' }))
    expect(mockReplace).toHaveBeenCalledWith('/admin/pois/a?city_id=c', { scroll: false })
  })

  it('AC-04-02 : « Suivant » désactivé sur le dernier POI de la page', () => {
    renderPanel({ neighbors: { ...neighbors, index: 3, nextHref: null } })

    expect(screen.getByRole('button', { name: 'POI suivant' })).toBeDisabled()
  })

  it('sans position connue, pas de navigation', () => {
    renderPanel({ neighbors: null })

    expect(screen.queryByRole('button', { name: 'POI suivant' })).not.toBeInTheDocument()
  })

  it('AC-04-03 : Alt+→ / Alt+← hors champ de saisie', () => {
    renderPanel()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight', altKey: true })
    expect(mockReplace).toHaveBeenLastCalledWith('/admin/pois/c?city_id=c', { scroll: false })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowLeft', altKey: true })
    expect(mockReplace).toHaveBeenLastCalledWith('/admin/pois/a?city_id=c', { scroll: false })
  })

  it('AC-04-03 : ignore les raccourcis dans un champ de saisie', () => {
    renderPanel()

    fireEvent.keyDown(screen.getByLabelText('Nom'), { key: 'ArrowRight', altKey: true })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('AC-02-02 : passer au suivant avec une saisie non enregistrée demande confirmation', () => {
    renderPanel()

    fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Autre' } })
    fireEvent.click(screen.getByRole('button', { name: 'POI suivant' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
