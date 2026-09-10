/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { siteBaseUrl } from '@/features/seo/lib/site'

jest.mock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  getPublishedLocalLanding: jest.fn(),
  listPublishedLocalLandingSummaries: jest.fn(),
}))
jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn().mockResolvedValue([]),
  listPublishedMarketingLodgingsForCity: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/features/local-seo/queries/landing-reviews', () => ({ listPublicLandingReviews: jest.fn().mockResolvedValue([]) }))

import * as concierge from '@/app/(public)/conciergerie/[city-slug]/page'
import * as seminar from '@/app/(public)/seminaires/[city-slug]/page'
import * as vacation from '@/app/(public)/locations-vacances/[city-slug]/page'
import { getPublishedLocalLanding, listPublishedLocalLandingSummaries } from '@/features/local-seo/queries/landing-pages'
import { listPublishedMarketingLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'

const routes = [
  { module: concierge, intent: 'CONCIERGE', segment: 'conciergerie', publicationKey: 'concierge' },
  { module: seminar, intent: 'SEMINAR', segment: 'seminaires', publicationKey: 'seminar' },
  { module: vacation, intent: 'VACATION_RENTAL', segment: 'locations-vacances', publicationKey: 'vacationRental' },
] as const
const props = { params: Promise.resolve({ 'city-slug': 'megeve' }) }

describe('048 persisted public local landings', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it.each(routes)('renders persisted Megève content for $intent', async ({ module, intent }) => {
    const landing = publicLocalLanding(intent)
    landing.page.cta_label = 'Contacter notre équipe locale'
    landing.page.cta_href = 'mailto:local@mystay.city'
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
    render(await module.default(props))
    expect(notFound).not.toHaveBeenCalled()
    expect(getPublishedLocalLanding).toHaveBeenCalledWith('megeve', intent)
    expect(screen.getByRole('heading', { level: 1, name: landing.page.h1 })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: landing.page.cta_label })[0]).toHaveAttribute('href', landing.page.cta_href)
    for (const text of [intent === 'CONCIERGE' ? 'Conciergerie locale' : landing.page.eyebrow, landing.page.hero_copy, landing.page.reassurance!, landing.page.local_title, landing.page.local_copy]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0)
    }
    for (const text of [landing.page.section_title, landing.page.section_copy, landing.page.highlights[0].title,
      landing.page.highlights[0].copy, landing.page.steps[0].title, landing.page.steps[0].copy,
      landing.page.faq[0].question, landing.page.faq[0].answer]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0)
    }
  })

  it.each(routes)('uses exact saved metadata and canonical for $intent', async ({ module, intent, segment }) => {
    const landing = publicLocalLanding(intent)
    landing.page.seo_title = `${landing.page.seo_title} | MyStay`
    landing.page.meta_description = 'Description persistée sans troncature. '.repeat(7)
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
    const metadata = await module.generateMetadata(props)
    expect(getPublishedLocalLanding).toHaveBeenCalledWith('megeve', intent)
    expect(metadata).toMatchObject({
      title: { absolute: landing.page.seo_title },
      description: landing.page.meta_description,
      alternates: { canonical: `/${segment}/megeve` },
      robots: { index: true, follow: true },
      openGraph: { title: landing.page.seo_title, description: landing.page.meta_description, url: `/${segment}/megeve` },
      twitter: { title: landing.page.seo_title },
    })
    expect(listPublishedMarketingLodgingsForCity).not.toHaveBeenCalled()
  })

  it.each(routes)('returns 404 and safe metadata for archived or deleted $intent', async ({ module, intent }) => {
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(null)
    await expect(module.default(props)).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
    expect(getPublishedLocalLanding).toHaveBeenCalledWith('megeve', intent)
    const metadata = await module.generateMetadata(props)
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.alternates?.canonical).toBeUndefined()
  })

  it.each(routes)('does not render empty optional text elements for $intent', async ({ module, intent }) => {
    const landing = publicLocalLanding(intent)
    landing.page.process_title = null
    landing.page.reassurance = null
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
    const { container } = render(await module.default(props))
    expect(Array.from(container.querySelectorAll('h2, p')).filter(element => !element.textContent?.trim())).toEqual([])
  })

  it('returns 404 when the repository withholds vacation publication without an eligible lodging', async () => {
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(null)
    await expect(vacation.default(props)).rejects.toThrow('NEXT_NOT_FOUND')
    expect(listPublishedMarketingLodgingsForCity).not.toHaveBeenCalled()
  })

  it.each(routes)('generates current persisted slugs independently for $intent', async ({ module, publicationKey }) => {
    const landing = publicLocalLanding()
    jest.mocked(listPublishedLocalLandingSummaries).mockResolvedValue([
      landing,
      { ...landing, city: { ...landing.city, slug: 'nouvelle-ville' }, publication: { ...landing.publication, [publicationKey]: false } },
    ])
    await expect(module.generateStaticParams()).resolves.toEqual([{ 'city-slug': 'megeve' }])
    expect(listPublishedLocalLandingSummaries).toHaveBeenCalledTimes(1)
  })

  it.each(routes.slice(0, 2))('describes the persisted visible service for $intent', async ({ module, intent, segment }) => {
    const landing = publicLocalLanding(intent)
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
    const { container } = render(await module.default(props))
    const schemas = Array.from(container.querySelectorAll('script[type="application/ld+json"]'), script => JSON.parse(script.textContent!))
    expect(schemas).toEqual(expect.arrayContaining([expect.objectContaining({
      '@type': 'Service', name: landing.page.h1, description: landing.page.meta_description,
      areaServed: { '@type': 'Place', name: landing.city.name },
      url: `${siteBaseUrl()}/${segment}/megeve`,
    })]))
  })
})
