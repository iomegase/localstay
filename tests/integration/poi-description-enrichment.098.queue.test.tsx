/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { DescriptionEnrichmentQueue, ENRICHMENT_BATCH_SIZE } from '@/features/admin-pois/components/DescriptionEnrichmentQueue'

const item = (index: number) => ({
  id: `p${index}`, name: `Lieu ${index}`, city_name: 'Saint-Gervais-les-Bains', category_name: 'Restaurant',
  word_count: 20 + index, public_path: `/decouvrir/saint-gervais-les-bains/diner/lieu-${index}`, description: 'Un lieu où l’on se sent bien.',
})
const longFactual = Array.from({ length: 30 }, (_, index) => `Fait vérifié numéro ${index + 1} sur la carte.`).join(' ')
const suggestion = (description: string) => ({ data: { description, source_mode: 'official_website', sources: [{ title: 'site.example', url: 'https://site.example/' }], search_entry_point: null } })

describe('098 — file d’enrichissement des descriptions', () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('AC-01-02 / BR-05: generates at most 10 proposals per click, one at a time', async () => {
    let inFlight = 0
    let maxInFlight = 0
    fetchMock.mockImplementation(async () => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise(resolve => setTimeout(resolve, 1))
      inFlight -= 1
      return { ok: true, json: async () => suggestion(longFactual) }
    })
    render(<DescriptionEnrichmentQueue items={Array.from({ length: 12 }, (_, index) => item(index))} />)
    fireEvent.click(screen.getByRole('button', { name: /Générer les propositions/ }))
    await waitFor(() => expect(screen.getAllByText('Proposition prête')).toHaveLength(ENRICHMENT_BATCH_SIZE))
    expect(fetchMock).toHaveBeenCalledTimes(10)
    expect(maxInFlight).toBe(1)
    expect(screen.getAllByText('À générer')).toHaveLength(2)
  })

  it('AC-01-03 / AC-02-02 / BR-03: shows current vs proposed, warnings, and publishes with sources', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => suggestion('Une adresse incontournable. Pizzas à emporter.') })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) })
    render(<DescriptionEnrichmentQueue items={[item(1)]} />)
    fireEvent.click(within(screen.getByTestId('enrichment-row-p1')).getByRole('button', { name: 'Générer' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Relire' }))

    const panel = screen.getByRole('region', { name: 'Relecture : Lieu 1' })
    expect(panel).toHaveTextContent('Actuelle · 21 mots')
    const warnings = within(panel).getByRole('list', { name: 'Avertissements' })
    expect(warnings).toHaveTextContent('Sources maigres')
    expect(warnings).toHaveTextContent('Formule creuse : « incontournable »')
    expect(within(panel).getByRole('link', { name: 'site.example' })).toHaveAttribute('href', 'https://site.example/')

    fireEvent.click(within(panel).getByRole('button', { name: 'Publier' }))
    await waitFor(() => expect(screen.getByText('Publiée')).toBeInTheDocument())
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/admin/pois/p1')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ description: 'Une adresse incontournable. Pizzas à emporter.', description_sources: [{ title: 'site.example', url: 'https://site.example/' }] })
  })

  it('AC-01-05: insufficient sources show no proposal; « Ignorer » leaves the description untouched', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: { code: 'DESCRIPTION_SOURCES_INSUFFICIENT', message: 'x' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => suggestion(longFactual) })
    render(<DescriptionEnrichmentQueue items={[item(1), item(2)]} />)
    fireEvent.click(within(screen.getByTestId('enrichment-row-p1')).getByRole('button', { name: 'Générer' }))
    expect(await screen.findByText('Sources insuffisantes')).toBeInTheDocument()
    expect(within(screen.getByTestId('enrichment-row-p1')).queryByRole('button', { name: 'Relire' })).not.toBeInTheDocument()

    fireEvent.click(within(screen.getByTestId('enrichment-row-p2')).getByRole('button', { name: 'Générer' }))
    fireEvent.click(await within(screen.getByTestId('enrichment-row-p2')).findByRole('button', { name: 'Relire' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorer' }))
    expect(within(screen.getByTestId('enrichment-row-p2')).getByText('Ignorée')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
