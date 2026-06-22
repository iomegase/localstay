const mockFindManyLiveEvents = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    analyticsVercelLiveEvent: {
      findMany: (...args: unknown[]) => mockFindManyLiveEvents(...args),
    },
  },
}))

import { getInternalVercelLiveBlock } from '@/features/admin-analytics/services/vercel-live-aggregate'

describe('030 vercel live aggregation', () => {
  const originalDateNow = Date.now

  beforeEach(() => {
    jest.clearAllMocks()
    Date.now = jest.fn(() => new Date('2026-06-22T10:30:00.000Z').getTime())
  })

  afterAll(() => {
    Date.now = originalDateNow
  })

  it('AC-05-06: aggregates visitors, page views, top pages and referrers for the last 30 minutes', async () => {
    mockFindManyLiveEvents.mockResolvedValue([
      {
        dedupe_key: 'a',
        source_event_type: 'pageview',
        occurred_at: new Date('2026-06-22T10:10:00.000Z'),
        session_id: 'session-1',
        device_id: 'device-1',
        page_path: '/guide/annecy',
        referrer: 'google.com',
      },
      {
        dedupe_key: 'b',
        source_event_type: 'pageview',
        occurred_at: new Date('2026-06-22T10:15:00.000Z'),
        session_id: 'session-1',
        device_id: 'device-1',
        page_path: '/guide/annecy',
        referrer: 'google.com',
      },
      {
        dedupe_key: 'c',
        source_event_type: 'pageview',
        occurred_at: new Date('2026-06-22T10:20:00.000Z'),
        session_id: 'session-2',
        device_id: 'device-2',
        page_path: '/guide/chamonix',
        referrer: 'bing.com',
      },
    ])

    const result = await getInternalVercelLiveBlock()

    expect(result).toEqual({
      status: 'connected',
      window_label: 'Last 30 minutes',
      visitors: 2,
      page_views: 3,
      top_pages: [
        { page_path: '/guide/annecy', page_views: 2 },
        { page_path: '/guide/chamonix', page_views: 1 },
      ],
      top_referrers: [
        { referrer: 'google.com', visitors: 2 },
        { referrer: 'bing.com', visitors: 1 },
      ],
    })
  })

  it('AC-05-05: returns a degraded no_data block when no recent rows exist', async () => {
    mockFindManyLiveEvents.mockResolvedValue([])

    const result = await getInternalVercelLiveBlock()

    expect(result).toEqual({
      status: 'no_data',
      window_label: 'Last 30 minutes',
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    })
  })
})
