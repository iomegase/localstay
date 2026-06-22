const mockUpsertLiveEvent = jest.fn()
const mockUpdateManyLiveEvents = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    analyticsVercelLiveEvent: {
      upsert: (...args: unknown[]) => mockUpsertLiveEvent(...args),
      updateMany: (...args: unknown[]) => mockUpdateManyLiveEvents(...args),
    },
  },
}))

import { ingestVercelDrainPayload } from '@/features/admin-analytics/services/vercel-drain'

describe('030 vercel drain ingestion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpsertLiveEvent.mockResolvedValue({})
    mockUpdateManyLiveEvents.mockResolvedValue({ count: 0 })
  })

  it('AC-05-07/BR-31: persists valid drain events idempotently with a deterministic dedupe key', async () => {
    const payload = [{
      schema: 'vercel.analytics.v2',
      eventType: 'pageview',
      eventName: null,
      eventData: null,
      timestamp: 1718870400000,
      projectId: 'prj_test123',
      ownerId: 'team_test123',
      sessionId: 12345,
      deviceId: 67890,
      origin: 'https://mystay.city',
      path: '/guide/annecy',
      referrer: 'google.com',
    }]

    const result = await ingestVercelDrainPayload(payload)

    expect(result).toEqual({ ingested: 1 })
    expect(mockUpsertLiveEvent).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        dedupe_key: expect.any(String),
      },
      create: expect.objectContaining({
        schema_name: 'vercel.analytics.v2',
        source_event_type: 'pageview',
        project_id: 'prj_test123',
        page_path: '/guide/annecy',
        referrer: 'google.com',
      }),
    }))
  })

  it('BR-32: soft-deletes stale live events older than the active retention window', async () => {
    await ingestVercelDrainPayload([{
      schema: 'vercel.analytics.v2',
      eventType: 'pageview',
      timestamp: 1718870400000,
      projectId: 'prj_test123',
    }])

    expect(mockUpdateManyLiveEvents).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        deleted_at: null,
        occurred_at: expect.objectContaining({
          lt: expect.any(Date),
        }),
      }),
      data: expect.objectContaining({
        deleted_at: expect.any(Date),
      }),
    }))
  })
})
