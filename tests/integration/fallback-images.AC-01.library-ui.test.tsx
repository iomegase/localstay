/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminFallbackImageLibrary } from '@/features/fallback-images/components/AdminFallbackImageLibrary'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
}))

// Spec 070 US-01 — écran de la médiathèque.
const categories = [
  { id: 'cat-shop', name: 'Shopping', subcategories: [{ id: 'sub-ski', name: 'Location de ski' }, { id: 'sub-bout', name: 'Boutiques locales' }] },
  { id: 'cat-diner', name: 'Restaurant', subcategories: [{ id: 'sub-resto', name: 'Restaurants' }] },
]
const images = [
  { id: 'img-1', url: 'https://cdn.example/1.webp', category: null, subcategory: null, usage_count: 0 },
  { id: 'img-2', url: 'https://cdn.example/2.webp', category: { id: 'cat-shop', name: 'Shopping' }, subcategory: { id: 'sub-ski', name: 'Location de ski' }, usage_count: 3 },
]

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function renderLibrary(filter: { filter?: 'unclassified'; category_id?: string; subcategory_id?: string } = {}) {
  return render(<AdminFallbackImageLibrary images={images} categories={categories} filter={filter} />)
}

describe('070 — médiathèque des images de remplacement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn(() => true)
    global.fetch = jest.fn(async () => jsonResponse({ data: { created: [{ id: 'n', url: 'u' }], rejected: [], updated: 2 } }, 201)) as jest.Mock
  })

  it('AC-01-03 : vignettes avec classement et nombre d’utilisations', () => {
    renderLibrary()

    const first = screen.getByRole('listitem', { name: 'Image img-1' })
    expect(within(first).getByText('Non classée')).toBeInTheDocument()
    expect(within(first).getByText('0 lieu')).toBeInTheDocument()
    const second = screen.getByRole('listitem', { name: 'Image img-2' })
    expect(within(second).getByText('Shopping › Location de ski')).toBeInTheDocument()
    expect(within(second).getByText('3 lieux')).toBeInTheDocument()
  })

  it('AC-01-03 : filtres « Toutes », « Non classées » et par catégorie', () => {
    renderLibrary({ filter: 'unclassified' })

    const nav = screen.getByRole('navigation', { name: 'Filtrer les images' })
    expect(within(nav).getByRole('link', { name: 'Toutes' })).toHaveAttribute('href', '/admin/fallback-images')
    expect(within(nav).getByRole('link', { name: 'Non classées' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Shopping' })).toHaveAttribute('href', '/admin/fallback-images?category_id=cat-shop')
  })

  it('AC-01-01 : envoi de plusieurs fichiers en une fois', async () => {
    renderLibrary()

    const input = screen.getByLabelText('Ajouter des images')
    expect(input).toHaveAttribute('multiple')
    fireEvent.change(input, { target: { files: [
      new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }),
      new File([new Uint8Array([1])], 'b.png', { type: 'image/png' }),
    ] } })

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]!
    expect(url).toBe('/api/admin/fallback-images')
    expect((init.body as FormData).getAll('files')).toHaveLength(2)
    expect(await screen.findByRole('status')).toHaveTextContent('1 image ajoutée')
  })

  it('AC-01-01 : signale les fichiers refusés', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ data: { created: [], rejected: [{ name: 'b.gif', code: 'INVALID_TYPE' }] } }, 201)) as jest.Mock
    renderLibrary()

    fireEvent.change(screen.getByLabelText('Ajouter des images'), { target: { files: [new File([new Uint8Array([1])], 'b.gif', { type: 'image/gif' })] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('b.gif : format non supporté')
  })

  it('AC-01-02 : classement groupé dans une sous-catégorie', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ data: { updated: 2 } })) as jest.Mock
    renderLibrary()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner l’image img-1' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner l’image img-2' }))
    const bar = screen.getByRole('region', { name: 'Classer la sélection' })
    expect(bar).toHaveTextContent('2 images sélectionnées')
    fireEvent.change(within(bar).getByLabelText('Catégorie'), { target: { value: 'cat-shop' } })
    fireEvent.change(within(bar).getByLabelText('Sous-catégorie'), { target: { value: 'sub-ski' } })
    fireEvent.click(within(bar).getByRole('button', { name: 'Classer' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/fallback-images/classify', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ image_ids: ['img-1', 'img-2'], category_id: 'cat-shop', subcategory_id: 'sub-ski' }),
    }))
  })

  it('BR-02 : la liste des sous-catégories suit la catégorie choisie', () => {
    renderLibrary()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner l’image img-1' }))
    const bar = screen.getByRole('region', { name: 'Classer la sélection' })
    fireEvent.change(within(bar).getByLabelText('Catégorie'), { target: { value: 'cat-diner' } })

    const options = within(within(bar).getByLabelText('Sous-catégorie')).getAllByRole('option').map(option => option.textContent)
    expect(options).toEqual(['Toute la catégorie', 'Restaurants'])
  })

  it('AC-01-04 : retirer une image après confirmation', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ data: { id: 'img-2' } })) as jest.Mock
    renderLibrary()

    fireEvent.click(within(screen.getByRole('listitem', { name: 'Image img-2' })).getByRole('button', { name: 'Retirer' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('3 lieux'))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/fallback-images/img-2', { method: 'DELETE' })
  })
})
