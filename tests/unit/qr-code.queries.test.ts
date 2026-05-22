jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    qrCode: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { getQrCode, upsertQrCode } from '@/features/qr-code/queries/qr-code'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('getQrCode', () => {
  it('returns null when city not found', async () => {
    ;(mockPrisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await getQrCode('unknown-city')
    expect(result).toBeNull()
  })

  it('returns null when no QrCode row for city', async () => {
    ;(mockPrisma.city.findFirst as jest.Mock).mockResolvedValue({ id: 'city-1', slug: 'saint-gervais-les-bains' })
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await getQrCode('saint-gervais-les-bains')
    expect(result).toBeNull()
  })

  it('returns QrCodeResult when row found', async () => {
    ;(mockPrisma.city.findFirst as jest.Mock).mockResolvedValue({ id: 'city-1', slug: 'saint-gervais-les-bains' })
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue({
      id: 'qr-1',
      city_id: 'city-1',
      url: 'https://example.com/guide/saint-gervais-les-bains',
      storage_url: 'https://supabase.co/storage/v1/object/public/qr-codes/saint-gervais-les-bains.png',
      created_at: new Date('2026-05-22T10:00:00Z'),
    })
    const result = await getQrCode('saint-gervais-les-bains')
    expect(result).toMatchObject({
      id: 'qr-1',
      city_slug: 'saint-gervais-les-bains',
      url: 'https://example.com/guide/saint-gervais-les-bains',
    })
  })
})

describe('upsertQrCode', () => {
  it('calls prisma upsert with correct args and returns QrCodeResult', async () => {
    ;(mockPrisma.qrCode.upsert as jest.Mock).mockResolvedValue({
      id: 'qr-1',
      city_id: 'city-1',
      url: 'https://example.com/guide/saint-gervais-les-bains',
      storage_url: 'https://supabase.co/storage/v1/object/public/qr-codes/saint-gervais-les-bains.png',
      created_at: new Date('2026-05-22T10:00:00Z'),
    })
    const result = await upsertQrCode(
      'city-1',
      'saint-gervais-les-bains',
      'https://example.com/guide/saint-gervais-les-bains',
      'https://supabase.co/storage/v1/object/public/qr-codes/saint-gervais-les-bains.png',
    )
    expect(mockPrisma.qrCode.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { city_id: 'city-1' },
        create: expect.objectContaining({ city_id: 'city-1', is_active: true }),
        update: expect.objectContaining({ storage_url: expect.any(String) }),
      }),
    )
    expect(result.city_slug).toBe('saint-gervais-les-bains')
  })
})
