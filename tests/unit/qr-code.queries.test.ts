jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    qrCode: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { getQrCode, upsertQrCode } from '@/features/qr-code/queries/qr-code'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const QR_ROW = {
  id: 'qr-1',
  city_id: 'city-1',
  url: 'https://example.com/guide/saint-gervais-les-bains',
  storage_url: 'https://supabase.co/storage/v1/object/public/qr-codes/saint-gervais-les-bains.png',
  created_at: new Date('2026-05-22T10:00:00Z'),
}

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
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue(QR_ROW)
    const result = await getQrCode('saint-gervais-les-bains')
    expect(result).toMatchObject({
      id: 'qr-1',
      city_slug: 'saint-gervais-les-bains',
      url: 'https://example.com/guide/saint-gervais-les-bains',
    })
  })
})

describe('upsertQrCode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a new record when none exists and returns QrCodeResult', async () => {
    // findFirst returns null → no existing city-level QR code
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.qrCode.create as jest.Mock).mockResolvedValue(QR_ROW)

    const result = await upsertQrCode(
      'city-1',
      'saint-gervais-les-bains',
      QR_ROW.url,
      QR_ROW.storage_url,
    )

    expect(mockPrisma.qrCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { city_id: 'city-1', lodging_id: null } }),
    )
    expect(mockPrisma.qrCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ city_id: 'city-1', is_active: true }),
      }),
    )
    expect(result.city_slug).toBe('saint-gervais-les-bains')
  })

  it('updates the existing record when one exists and returns QrCodeResult', async () => {
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue({ id: 'qr-1' })
    ;(mockPrisma.qrCode.update as jest.Mock).mockResolvedValue(QR_ROW)

    const result = await upsertQrCode(
      'city-1',
      'saint-gervais-les-bains',
      QR_ROW.url,
      QR_ROW.storage_url,
    )

    expect(mockPrisma.qrCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'qr-1' },
        data: expect.objectContaining({ storage_url: QR_ROW.storage_url, is_active: true }),
      }),
    )
    expect(result.city_slug).toBe('saint-gervais-les-bains')
  })
})

describe('uploadQrToStorage is exported', () => {
  it('is a function', () => {
    expect(typeof uploadQrToStorage).toBe('function')
  })
})
