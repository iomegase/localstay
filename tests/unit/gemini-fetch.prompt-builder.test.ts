import { buildGeminiPrompt } from '@/features/gemini-fetch/services/prompt-builder'

describe('buildGeminiPrompt', () => {
  it('includes city name and postal code', () => {
    const prompt = buildGeminiPrompt({
      cityName: 'Saint-Gervais-les-Bains',
      postalCode: '74170',
      categoryName: 'restaurants',
      radiusKm: 10,
    })
    expect(prompt).toContain('Saint-Gervais-les-Bains')
    expect(prompt).toContain('74170')
  })

  it('includes category name', () => {
    const prompt = buildGeminiPrompt({
      cityName: 'Annecy',
      postalCode: '74000',
      categoryName: 'randonnées',
      radiusKm: 10,
    })
    expect(prompt).toContain('randonnées')
  })

  it('includes radius', () => {
    const prompt = buildGeminiPrompt({
      cityName: 'Annecy',
      postalCode: '74000',
      categoryName: 'restaurants',
      radiusKm: 42,  // distinctive value to avoid substring coincidence
    })
    expect(prompt).toContain('42')
  })

  it('requests JSON-only response', () => {
    const prompt = buildGeminiPrompt({
      cityName: 'Annecy',
      postalCode: '74000',
      categoryName: 'restaurants',
      radiusKm: 10,
    })
    expect(prompt).toContain('JSON')
  })

  it('includes maximum 20 POI constraint', () => {
    const prompt = buildGeminiPrompt({
      cityName: 'Annecy',
      postalCode: '74000',
      categoryName: 'restaurants',
      radiusKm: 10,
    })
    expect(prompt).toContain('Maximum 20')
  })
})
