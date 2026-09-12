const mockTransaction = jest.fn()
const mockPublicDestination = jest.fn()
const mockPublicProfiles = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  $transaction: (...args: unknown[]) => mockTransaction(...args),
  localLandingDestination: { findFirst: (...args: unknown[]) => mockPublicDestination(...args) },
  lodgingPublicProfile: { findMany: (...args: unknown[]) => mockPublicProfiles(...args) },
} }))

import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import {
  createLandingDestination, deleteLandingDestination, getPublishedLocalLanding, setLandingDestinationActive, updateLandingDestinationPages,
} from '@/features/local-seo/queries/landing-pages'
import { restoreLandingReview } from '@/features/local-seo/queries/landing-reviews'
import { LOCAL_LANDING_INTENTS, type LocalLandingPageInput } from '@/features/local-seo/types/landing-pages'
import { landingDate, landingDestinationRow, landingPageInput, landingPageRow, landingReviewRow } from '../fixtures/local-landing-management'

const db = {
  city: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
  localLandingDestination: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  localLandingPage: { upsert: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
  localLandingReview: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
  lodgingPublicProfile: { findMany: jest.fn() },
}

describe('048 AC-02–05 transactional mutations', () => {
  let destination = landingDestinationRow()
  beforeEach(() => {
    jest.clearAllMocks()
    destination = { ...landingDestinationRow(), is_active: false }
    mockTransaction.mockImplementation(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db))
    db.city.findFirst.mockResolvedValue(destination.city)
    db.localLandingDestination.findFirst.mockImplementation(async () => destination)
    db.localLandingDestination.findUnique.mockResolvedValue(null)
    db.localLandingDestination.create.mockResolvedValue(destination)
    db.localLandingDestination.update.mockImplementation(async ({ data }: { data: { is_active?: boolean; deleted_at?: Date | null } }) => {
      Object.assign(destination, data)
      return destination
    })
    db.localLandingDestination.updateMany.mockImplementation(async ({ data }: { data: { is_active?: boolean; deleted_at?: Date } }) => {
      Object.assign(destination, data)
      return { count: 1 }
    })
    db.localLandingPage.upsert.mockImplementation(async ({ create, update }: {
      create: LocalLandingPageInput
      update: LocalLandingPageInput & { deleted_at: null }
    }) => {
      const index = destination.pages.findIndex(page => page.intent === create.intent)
      const row = index === -1 ? { ...landingPageRow(create.intent), ...create } : { ...destination.pages[index], ...update }
      if (index === -1) destination.pages.push(row)
      else destination.pages[index] = row
      return row
    })
    db.localLandingPage.updateMany.mockResolvedValue({ count: 3 })
    db.localLandingReview.findMany.mockResolvedValue([])
    db.localLandingReview.updateMany.mockResolvedValue({ count: 1 })
    db.lodgingPublicProfile.findMany.mockResolvedValue([])
    mockPublicDestination.mockImplementation(async () => destination)
    mockPublicProfiles.mockResolvedValue([])
  })

  afterEach(() => {
    expect(db.city.update).not.toHaveBeenCalled()
    expect(db.city.updateMany).not.toHaveBeenCalled()
    expect(db.city.delete).not.toHaveBeenCalled()
    expect(db.localLandingPage.deleteMany).not.toHaveBeenCalled()
    expect(db.localLandingReview.deleteMany).not.toHaveBeenCalled()
  })

  it('creates one inactive destination and exactly three blank pages in one transaction', async () => {
    const result = await createLandingDestination('city-1')
    expect(result.is_active).toBe(false)
    expect(result.pages.map(page => page.h1)).toEqual(['', '', ''])
    expect(db.localLandingDestination.create).toHaveBeenCalledWith({ data: { city_id: 'city-1', is_active: false } })
    expect(db.localLandingPage.upsert).toHaveBeenCalledTimes(3)
    for (const intent of LOCAL_LANDING_INTENTS) {
      expect(db.localLandingPage.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ destination_id: 'destination-1', intent, h1: '', highlights: [], faq: [] }),
      }))
    }
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
  })

  it('validates the City before writing anything', async () => {
    db.city.findFirst.mockResolvedValue(null)
    await expect(createLandingDestination('unknown')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(db.city.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'unknown', is_active: true, deleted_at: null } }))
    expect(db.localLandingDestination.create).not.toHaveBeenCalled()
    expect(db.localLandingPage.upsert).not.toHaveBeenCalled()
  })

  it('refuses an already configured City without a partial write', async () => {
    db.localLandingDestination.findUnique.mockResolvedValue(destination)
    await expect(createLandingDestination('city-1')).rejects.toMatchObject({ code: 'DESTINATION_ALREADY_EXISTS', status: 409 })
    expect(db.localLandingDestination.create).not.toHaveBeenCalled()
    expect(db.localLandingPage.upsert).not.toHaveBeenCalled()
  })

  it('maps a concurrent uniqueness conflict to DESTINATION_ALREADY_EXISTS', async () => {
    db.localLandingDestination.create.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Unique conflict', { code: 'P2002', clientVersion: '5' }))
    await expect(createLandingDestination('city-1')).rejects.toMatchObject({ code: 'DESTINATION_ALREADY_EXISTS', status: 409 })
  })

  it('reinitializes a soft-deleted unique destination and leaves old reviews archived', async () => {
    db.localLandingDestination.findUnique.mockResolvedValue({ ...destination, deleted_at: landingDate })
    const oldReview = { ...landingReviewRow(), deleted_at: landingDate, is_active: false, deleted_with_destination: true }
    db.localLandingReview.findMany.mockResolvedValue([oldReview])
    const result = await createLandingDestination('city-1')
    expect(db.localLandingDestination.create).not.toHaveBeenCalled()
    expect(db.localLandingDestination.update).toHaveBeenCalledWith({ where: { id: 'destination-1' }, data: { is_active: false, deleted_at: null } })
    expect(db.localLandingPage.upsert).toHaveBeenCalledTimes(3)
    expect(db.localLandingPage.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ deleted_at: null, h1: '', cta_href: '', steps: [] }),
    }))
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { deleted_at: null, destination_id: 'destination-1' },
      data: { deleted_at: expect.any(Date), is_active: false, deleted_with_destination: true },
    })
    expect(result.reviewCount).toBe(0)
    expect(result.reviews).toEqual([])
    expect(result.pages.map(page => page.h1)).toEqual(['', '', ''])
  })

  it('marks an individually archived legacy review as deleted with its reinitialized destination', async () => {
    db.localLandingDestination.findUnique.mockResolvedValue({ ...destination, deleted_at: landingDate })
    const archivedReview = { ...landingReviewRow(), deleted_at: landingDate, is_active: false }
    db.localLandingReview.findMany.mockResolvedValue([archivedReview])
    db.localLandingReview.updateMany.mockImplementation(async ({ where, data }: {
      where: { deleted_at?: null | { not: null } }
      data: Partial<typeof archivedReview>
    }) => {
      const matchesArchiveState = where.deleted_at === undefined
        || (where.deleted_at === null && archivedReview.deleted_at === null)
        || (where.deleted_at !== null && typeof where.deleted_at === 'object' && archivedReview.deleted_at !== null)
      if (matchesArchiveState) Object.assign(archivedReview, data)
      return { count: matchesArchiveState ? 1 : 0 }
    })

    await createLandingDestination('city-1')

    expect(archivedReview).toMatchObject({
      deleted_at: landingDate,
      is_active: false,
      deleted_with_destination: true,
    })
  })

  it('saves all three validated drafts without publishing the destination', async () => {
    const pages = LOCAL_LANDING_INTENTS.map(landingPageInput)
    const result = await updateLandingDestinationPages('destination-1', pages)
    expect(result.publication).toEqual({ concierge: false, seminar: false, vacationRental: false })
    expect(db.localLandingPage.upsert).toHaveBeenCalledTimes(3)
    expect(db.localLandingDestination.updateMany).not.toHaveBeenCalled()
    expect(db.localLandingDestination.update).not.toHaveBeenCalled()
  })

  it('validates exactly three distinct intentions before starting a transaction', async () => {
    await expect(updateLandingDestinationPages('destination-1', [landingPageInput('CONCIERGE'), landingPageInput('CONCIERGE'), landingPageInput('SEMINAR')])).rejects.toBeInstanceOf(ZodError)
    await expect(updateLandingDestinationPages('destination-1', [landingPageInput('CONCIERGE')])).rejects.toBeInstanceOf(ZodError)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it.each([false, true])('creates/reinitializes (%s), progressively saves service drafts and activates with blank Locations', async reinitialize => {
    if (reinitialize) db.localLandingDestination.findUnique.mockResolvedValue({ ...destination, deleted_at: landingDate })
    const created = await createLandingDestination('city-1')
    const incomplete = created.pages.map(page => page.intent === 'CONCIERGE'
      ? { ...page, h1: 'Projet en cours', highlights: [{ title: 'Accueil', copy: '' }] } : page)
    const saved = await updateLandingDestinationPages(created.id, incomplete)
    expect(saved.pages[0].highlights).toEqual([{ title: 'Accueil', copy: '' }])
    expect(saved.is_active).toBe(false)
    await expect(setLandingDestinationActive(created.id, true)).rejects.toMatchObject({ code: 'INCOMPLETE_CONTENT', details: { missingFields: expect.arrayContaining(['SEMINAR.h1']) } })
    await updateLandingDestinationPages(created.id, saved.pages.map(page => page.intent === 'VACATION_RENTAL' ? page : landingPageInput(page.intent)))
    expect((await setLandingDestinationActive(created.id, true)).publication).toEqual({ concierge: true, seminar: true, vacationRental: false })
    expect(await getPublishedLocalLanding('megeve', 'CONCIERGE')).not.toBeNull()
    expect(await getPublishedLocalLanding('megeve', 'SEMINAR')).not.toBeNull()
    expect(await getPublishedLocalLanding('megeve', 'VACATION_RENTAL')).toBeNull()
    mockPublicProfiles.mockResolvedValue([{ city_id: 'city-1' }])
    expect(await getPublishedLocalLanding('megeve', 'VACATION_RENTAL')).toBeNull()
  })

  it('keeps placeholder drafts editable and rejects their activation with nested details', async () => {
    const pages = LOCAL_LANDING_INTENTS.map(landingPageInput)
    pages[0].h1 = ' À COMPLÉTER '
    pages[1].faq[0].answer = 'Lorem ipsum dolor sit amet.'
    const result = await updateLandingDestinationPages('destination-1', pages)
    expect(result.pages[1].faq[0].answer).toBe('Lorem ipsum dolor sit amet.')
    await expect(setLandingDestinationActive('destination-1', true)).rejects.toMatchObject({
      code: 'INCOMPLETE_CONTENT', status: 400,
      details: { missingFields: expect.arrayContaining(['CONCIERGE.h1', 'SEMINAR.faq.0.answer']), issues: expect.arrayContaining([expect.objectContaining({ field: 'faq.0.answer', message: expect.stringMatching(/placeholder/i) })]) },
    })
    expect(db.localLandingDestination.updateMany).not.toHaveBeenCalled()
    destination.is_active = true
    expect(await getPublishedLocalLanding('megeve', 'CONCIERGE')).toBeNull()
    expect(await getPublishedLocalLanding('megeve', 'SEMINAR')).toBeNull()
  })

  it('returns NOT_FOUND before updating a missing destination', async () => {
    db.localLandingDestination.findFirst.mockResolvedValue(null)
    await expect(updateLandingDestinationPages('unknown', LOCAL_LANDING_INTENTS.map(landingPageInput))).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(db.localLandingPage.upsert).not.toHaveBeenCalled()
  })

  it.each([
    ['cta_href', 'https://external.invalid/'],
    ['h1', 'x'],
    ['highlights', [{ question: 'Wrong shape', answer: 'Wrong shape' }]],
    ['steps', { title: 'Not an array' }],
    ['faq', [{ title: 'Wrong shape', copy: 'Wrong shape' }]],
  ] as const)('refuses invalid persisted %s during activation with precise field details', async (field, value) => {
    destination.pages[0] = { ...destination.pages[0], [field]: value }
    await expect(setLandingDestinationActive('destination-1', true)).rejects.toMatchObject({
      code: 'INCOMPLETE_CONTENT', status: 400,
      details: { issues: expect.arrayContaining([expect.objectContaining({ intent: 'CONCIERGE', field: expect.stringContaining(field) })]) },
    })
    expect(db.localLandingDestination.updateMany).not.toHaveBeenCalled()
  })

  it('requires both services but allows activation with an incomplete vacation page', async () => {
    destination.pages[2].h1 = ''
    const activated = await setLandingDestinationActive('destination-1', true)
    expect(activated.publication).toEqual({ concierge: true, seminar: true, vacationRental: false })
    expect(db.localLandingDestination.updateMany).toHaveBeenCalledWith({ where: { id: 'destination-1', deleted_at: null }, data: { is_active: true } })
    destination.pages[1].h1 = ''
    await expect(setLandingDestinationActive('destination-1', true)).rejects.toMatchObject({
      details: { missingFields: expect.arrayContaining(['SEMINAR.h1']) },
    })
  })

  it('does not activate a destination whose City is inactive', async () => {
    destination.city.is_active = false
    await expect(setLandingDestinationActive('destination-1', true)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(db.localLandingDestination.updateMany).not.toHaveBeenCalled()
  })

  it('archives without validating, deleting or rewriting content and reviews', async () => {
    destination.pages[0].faq = 'corrupt'
    await setLandingDestinationActive('destination-1', false)
    expect(db.localLandingDestination.updateMany).toHaveBeenCalledWith({ where: { id: 'destination-1', deleted_at: null }, data: { is_active: false } })
    expect(db.localLandingPage.upsert).not.toHaveBeenCalled()
    expect(db.localLandingPage.updateMany).not.toHaveBeenCalled()
    expect(db.localLandingReview.updateMany).not.toHaveBeenCalled()
  })

  it('deletes destination, pages and linked reviews with the same timestamp', async () => {
    expect(await deleteLandingDestination('destination-1')).toEqual({ id: 'destination-1', city_slug: 'megeve' })
    const deletedAt = db.localLandingDestination.updateMany.mock.calls[0][0].data.deleted_at
    expect(deletedAt).toBeInstanceOf(Date)
    expect(db.localLandingPage.updateMany).toHaveBeenCalledWith({ where: { destination_id: 'destination-1' }, data: { deleted_at: deletedAt } })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { destination_id: 'destination-1' },
      data: { deleted_at: deletedAt, is_active: false, deleted_with_destination: true },
    })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('never exposes or restores a group-deleted review after re-add and reactivation', async () => {
    const review = landingReviewRow()
    db.localLandingReview.findMany.mockImplementation(async () => [review])
    db.localLandingReview.updateMany.mockImplementation(async ({ where, data }: {
      where: { deleted_at?: null }
      data: Partial<typeof review>
    }) => {
      if (where.deleted_at === null && review.deleted_at !== null) return { count: 0 }
      Object.assign(review, data)
      return { count: 1 }
    })
    db.localLandingReview.findFirst.mockImplementation(async ({ where }: { where: { deleted_with_destination: boolean } }) => (
      review.deleted_with_destination === where.deleted_with_destination ? review : null
    ))
    await deleteLandingDestination('destination-1')
    expect(review.deleted_with_destination).toBe(true)
    expect(review.deleted_at).toBeInstanceOf(Date)
    db.localLandingDestination.findUnique.mockResolvedValue(destination)
    const recreated = await createLandingDestination('city-1')
    expect(recreated.reviews).toEqual([])
    expect(recreated.reviewCount).toBe(0)
    await updateLandingDestinationPages('destination-1', LOCAL_LANDING_INTENTS.map(landingPageInput))
    expect((await setLandingDestinationActive('destination-1', true)).publication.concierge).toBe(true)
    await expect(restoreLandingReview('review-1')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(db.localLandingReview.update).not.toHaveBeenCalled()
    expect(review.deleted_with_destination).toBe(true)
    expect(review.is_active).toBe(false)
    expect(review.deleted_at).toBeInstanceOf(Date)
  })

  it('refuses a second deletion or unknown destination without writes', async () => {
    db.localLandingDestination.findFirst.mockResolvedValue(null)
    await expect(deleteLandingDestination('unknown')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(db.localLandingDestination.updateMany).not.toHaveBeenCalled()
    expect(db.localLandingPage.updateMany).not.toHaveBeenCalled()
    expect(db.localLandingReview.updateMany).not.toHaveBeenCalled()
  })

  it('propagates a child write failure through the transaction so no partial deletion commits', async () => {
    const persisted = { destinationDeleted: false, pagesDeleted: false }
    db.localLandingDestination.updateMany.mockImplementationOnce(async () => { persisted.destinationDeleted = true; return { count: 1 } })
    db.localLandingPage.updateMany.mockImplementationOnce(async () => { persisted.pagesDeleted = true; return { count: 3 } })
    db.localLandingReview.updateMany.mockRejectedValueOnce(new Error('review write failed'))
    mockTransaction.mockImplementationOnce(async (callback: (tx: typeof db) => Promise<unknown>) => {
      const before = { ...persisted }
      try { return await callback(db) } catch (error) { Object.assign(persisted, before); throw error }
    })
    await expect(deleteLandingDestination('destination-1')).rejects.toThrow('review write failed')
    expect(persisted).toEqual({ destinationDeleted: false, pagesDeleted: false })
  })
})
