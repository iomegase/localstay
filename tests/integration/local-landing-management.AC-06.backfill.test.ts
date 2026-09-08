import { readFileSync } from 'node:fs'
import { localSeoDestinations } from '@/features/local-seo/content/destinations'
import { getLocalConciergeLandingContent } from '@/features/local-seo/content/concierge-landings'
import { landingPageInputSchema } from '@/features/local-seo/schemas/landing-pages'
import { LOCAL_LANDING_INTENTS } from '@/features/local-seo/types/landing-pages'
import {
  backfillLocalLandingDestinations,
  buildLocalLandingBackfill,
  type BackfillClient,
} from '../../prisma/backfill-local-landing-destinations'

type Seed = ReturnType<typeof buildLocalLandingBackfill>[number]
type Destination = { id: string; city_id: string; is_active: boolean; deleted_at: Date | null }
type Page = Seed['pages'][number] & { destination_id: string; deleted_at: Date | null }

function memoryDatabase() {
  const cities = localSeoDestinations.map((source, index) => ({ id: `city-${index}`, slug: source.slug }))
  const destinations = new Map<string, Destination>()
  const pages = new Map<string, Page>()
  const reviews = localSeoDestinations.map((source, index) => ({
    id: `review-${index}`, destination_slug: source.slug as string, destination_id: null as string | null,
    author: `Author ${index}`, quote: `Verified review ${index}`, stay_date: 'Août 2026',
    source: index % 2 ? 'DIRECT' : 'AIRBNB', rating: index % 2 ? null : 5,
    is_active: index === 0, sort_order: index,
    created_at: new Date('2026-09-01'), updated_at: new Date('2026-09-02'),
    deleted_at: index === 2 ? new Date('2026-09-03') : null,
  }))
  const tx = {
    city: { findMany: jest.fn(async () => cities) },
    localLandingDestination: {
      upsert: jest.fn(async ({ where, create, update }: {
        where: { city_id: string }; create: Omit<Destination, 'id' | 'deleted_at'>; update: Partial<Destination>
      }) => {
        const existing = destinations.get(where.city_id)
        const row = existing ? { ...existing, ...update } : { ...create, id: `dest-${create.city_id}`, deleted_at: null }
        destinations.set(where.city_id, row)
        return row
      }),
    },
    localLandingPage: {
      upsert: jest.fn(async ({ create, update }: { create: Omit<Page, 'deleted_at'>; update: Partial<Page> }) => {
        const key = `${create.destination_id}:${create.intent}`
        const existing = pages.get(key)
        const row = existing ? { ...existing, ...update } : { ...create, deleted_at: null }
        pages.set(key, row)
        return row
      }),
    },
    localLandingReview: {
      findMany: jest.fn(async () => reviews.filter(review => review.destination_id === null)),
      updateMany: jest.fn(async ({ where, data }: {
        where: { id: string; destination_id: null }; data: { destination_id: string; updated_at: Date }
      }) => {
        const review = reviews.find(row => row.id === where.id && row.destination_id === null)
        if (review) Object.assign(review, { updated_at: new Date() }, data)
        return { count: review ? 1 : 0 }
      }),
    },
  }
  const transaction = jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
  return { cities, destinations, pages, reviews, tx, client: { $transaction: transaction } as unknown as BackfillClient }
}

describe('048 AC-06 — offline local landing backfill', () => {
  it('maps the four reviewed Cities into exactly three pages and preserves service publication', () => {
    const seeds = buildLocalLandingBackfill()
    expect(seeds.map(seed => [seed.slug, seed.is_active])).toEqual([
      ['saint-gervais-les-bains', true], ['saint-nicolas-de-veroce', true], ['megeve', false], ['combloux', false],
    ])
    seeds.forEach(seed => expect(seed.pages.map(page => page.intent)).toEqual(LOCAL_LANDING_INTENTS))
    seeds.filter(seed => seed.is_active).forEach(seed => {
      seed.pages.forEach(page => expect(landingPageInputSchema.safeParse(page).success).toBe(true))
    })
  })

  it('preserves every detailed concierge field, highlight, step and FAQ', () => {
    buildLocalLandingBackfill().forEach((seed, index) => {
      const source = localSeoDestinations[index]
      const content = getLocalConciergeLandingContent(source)
      expect(seed.pages[0]).toMatchObject({
        intent: 'CONCIERGE', seo_title: source.services.concierge.h1,
        meta_description: source.services.concierge.metaDescription, eyebrow: source.services.concierge.eyebrow,
        h1: source.services.concierge.h1, hero_title: content.promise, hero_copy: content.heroCopy,
        reassurance: content.reassurance, section_title: content.ownerTitle, section_copy: content.ownerCopy,
        process_title: source.services.concierge.processTitle,
        local_title: content.localHeading, local_copy: content.localCopy,
        cta_label: source.services.concierge.ctaLabel, cta_href: source.services.concierge.ctaHref,
        highlights: source.services.concierge.highlights, steps: source.services.concierge.steps, faq: content.faq,
      })
    })
  })

  it('preserves seminar scalars and repeatable blocks plus every vacation rental field', () => {
    buildLocalLandingBackfill().forEach((seed, index) => {
      const { seminar, vacationRental } = localSeoDestinations[index].services
      expect(seed.pages[1]).toEqual({
        intent: 'SEMINAR', seo_title: seminar.h1, meta_description: seminar.metaDescription,
        eyebrow: seminar.eyebrow, h1: seminar.h1, hero_title: seminar.h1, hero_copy: seminar.intro,
        reassurance: null, section_title: seminar.sectionTitle, section_copy: seminar.sectionCopy,
        process_title: seminar.processTitle, local_title: seminar.localTitle, local_copy: seminar.localCopy,
        cta_label: seminar.ctaLabel, cta_href: seminar.ctaHref, empty_copy: null,
        highlights: seminar.highlights, steps: seminar.steps, faq: seminar.faq,
      })
      expect(seed.pages[2]).toMatchObject({
        intent: 'VACATION_RENTAL', seo_title: vacationRental.h1, h1: vacationRental.h1,
        meta_description: vacationRental.metaDescription, eyebrow: vacationRental.eyebrow,
        hero_copy: vacationRental.intro, local_title: vacationRental.localTitle,
        local_copy: vacationRental.localCopy, empty_copy: vacationRental.emptyCopy,
      })
    })
  })

  it('attaches all existing reviews, including archived/deleted ones, without altering their values', async () => {
    const db = memoryDatabase()
    const before = structuredClone(db.reviews)
    await backfillLocalLandingDestinations(db.client)
    expect(db.destinations.size).toBe(4)
    expect(db.pages.size).toBe(12)
    db.reviews.forEach((review, index) => expect(review).toEqual({
      ...before[index], destination_id: `dest-city-${index}`,
    }))
    expect(db.cities).toEqual(localSeoDestinations.map((source, index) => ({ id: `city-${index}`, slug: source.slug })))
  })

  it('never overwrites Admin content, publication or soft deletion when rerun', async () => {
    const db = memoryDatabase()
    expect(await backfillLocalLandingDestinations(db.client)).toEqual({
      processedDestinations: 4, processedPages: 12, attachedReviews: 4,
    })
    const page = db.pages.get('dest-city-0:CONCIERGE')!
    page.hero_copy = 'Texte rédigé par un Admin'
    page.faq = [{ question: 'Une nouvelle question ?', answer: 'Une réponse personnelle.' }]
    page.deleted_at = new Date('2026-09-08')
    const destination = db.destinations.get('city-0')!
    destination.is_active = false
    destination.deleted_at = new Date('2026-09-08')
    const snapshot = () => ({ destinations: [...db.destinations.values()], pages: [...db.pages.values()], reviews: db.reviews })
    const before = structuredClone(snapshot())
    expect(await backfillLocalLandingDestinations(db.client)).toEqual({
      processedDestinations: 4, processedPages: 12, attachedReviews: 0,
    })
    expect(snapshot()).toEqual(before)
    expect(db.tx.localLandingReview.updateMany).toHaveBeenCalledTimes(4)
  })

  it('fails before writes if a reviewed City is missing', async () => {
    const db = memoryDatabase()
    db.cities.pop()
    await expect(backfillLocalLandingDestinations(db.client)).rejects.toThrow('Missing City for combloux')
    expect(db.destinations.size).toBe(0)
    expect(db.pages.size).toBe(0)
  })

  it('fails before writes if an unlinked review cannot be mapped to a reviewed destination', async () => {
    const db = memoryDatabase()
    db.reviews[0].destination_slug = 'unknown-city'
    await expect(backfillLocalLandingDestinations(db.client)).rejects.toThrow('unknown-city')
    expect(db.destinations.size).toBe(0)
    expect(db.pages.size).toBe(0)
  })

  it('has the approved uniqueness, inverse relations and staged nullable review link', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8')
    expect(schema).toMatch(/enum LocalLandingIntent\s*\{\s*CONCIERGE\s*SEMINAR\s*VACATION_RENTAL\s*\}/)
    expect(schema).toMatch(/city_id\s+String\s+@unique/)
    expect(schema).toMatch(/local_landing_destination\s+LocalLandingDestination\?/)
    expect(schema).toContain('@@unique([destination_id, intent])')
    expect(schema).toContain('@@index([destination_id, deleted_at])')
    const review = schema.match(/model LocalLandingReview \{([\s\S]*?)\n\}/)?.[1]
    expect(review).toMatch(/destination_id\s+String\?/)
    expect(review).toMatch(/destination\s+LocalLandingDestination\?\s+@relation/)
  })
})
