/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { listSeminarLodgings } from '@/features/lodging-showcase/queries/seminar-lodgings'
import { getPublishedLocalLanding } from '@/features/local-seo/queries/landing-pages'
import SeminarsPage from '@/app/(public)/seminaires/page'
import SeminarCityPage from '@/app/(public)/seminaires/[city-slug]/page'

jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({ listSeminarLodgings: jest.fn() }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({ getPublishedLocalLanding: jest.fn(), listPublishedLocalLandingSummaries: jest.fn().mockResolvedValue([]) }))
jest.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
const card = { id: 'p1', title: 'T2 cosy', cityName: 'Saint-Gervais', href: '/logements/t2-cosy', photo: null }
beforeEach(() => { jest.clearAllMocks(); jest.mocked(listSeminarLodgings).mockResolvedValue([card]) })
it('renders the global selection before the venue section', async () => {
  render(await SeminarsPage())
  expect(listSeminarLodgings).toHaveBeenCalledWith()
  const section = screen.getByRole('region', { name: 'Nos logements pour vos séminaires' })
  expect(section.compareDocumentPosition(screen.getByTestId('seminar-place')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByRole('link', { name: 'T2 cosy Saint-Gervais' })).toHaveAttribute('href', '/logements/t2-cosy')
})
it('passes the resolved City.id to the local selection', async () => {
  const landing = publicLocalLanding('SEMINAR', { id: 'city-saint-gervais', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais' })
  jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
  render(await SeminarCityPage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) }))
  expect(listSeminarLodgings).toHaveBeenCalledWith('city-saint-gervais')
  expect(screen.getByRole('heading', { name: 'Nos logements pour vos séminaires' })).toBeVisible()
})
it('does not read or render a selection for an unpublished landing', async () => {
  jest.mocked(getPublishedLocalLanding).mockResolvedValue(null)
  await expect(SeminarCityPage({ params: Promise.resolve({ 'city-slug': 'inactive' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  expect(listSeminarLodgings).not.toHaveBeenCalled()
})
