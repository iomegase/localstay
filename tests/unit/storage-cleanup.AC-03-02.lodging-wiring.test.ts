import { prisma } from '@/shared/lib/prisma'
import { NextRequest } from 'next/server'
import { deleteUnreferencedFiles } from '@/features/storage-cleanup/services/delete-files'
import { lodgingGuidePhotoUrls } from '@/features/storage-cleanup/queries/references'
import { deleteOwnerLodgingPhoto } from '@/features/lodging-showcase/queries/owner-public-profile'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/features/storage-cleanup/services/delete-files', () => ({
  deleteUnreferencedFiles: jest.fn(async () => ({ deleted: 1 })),
  cleanupRemovedPoiPhotos: jest.fn(),
}))
jest.mock('@/features/storage-cleanup/queries/references', () => ({
  lodgingGuidePhotoUrls: jest.fn(),
  poiPhotoUrls: jest.fn(async () => []),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingPublicProfile: { findUnique: jest.fn() },
    lodgingPhoto: { updateMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}))
const mockGetSessionOwner = jest.fn()
const mockSaveCustomization = jest.fn()
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({ getSessionOwner: () => mockGetSessionOwner() }))
jest.mock('@/features/guide-customization/queries/customization', () => ({
  getLodgingCustomization: jest.fn(),
  saveLodgingCustomization: (...args: unknown[]) => mockSaveCustomization(...args),
}))

import { PUT } from '@/app/api/dashboard/lodgings/[id]/customization/route'

// Spec 070 AC-03-02 — suppression des photos de logement retirées.
const PHOTO = 'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/lodgings/l1/showcase/1.webp'

describe('070 AC-03-02 — logements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1', name: 'Chalet', city_id: 'c', city: { id: 'c', name: 'Megève', slug: 'megeve' },
    } as never)
    jest.mocked(prisma.lodgingPhoto.findFirst).mockResolvedValue({ url: PHOTO } as never)
    jest.mocked(prisma.lodgingPhoto.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(prisma.lodgingPhoto.findMany).mockResolvedValue([])
    jest.mocked(prisma.lodgingPublicProfile.findUnique).mockResolvedValue({ id: 'p', slug: 'chalet', city: { slug: 'megeve' } } as never)
    jest.mocked(prisma.$transaction).mockImplementation(async operation => (operation as (tx: unknown) => unknown)(prisma) as never)
  })

  it('retirer une photo de vitrine supprime son fichier', async () => {
    await expect(deleteOwnerLodgingPhoto('owner-1', 'lodging-1', 'photo-1')).resolves.toBe(true)
    expect(deleteUnreferencedFiles).toHaveBeenCalledWith([PHOTO])
  })

  it('photo déjà retirée : aucun fichier touché', async () => {
    jest.mocked(prisma.lodgingPhoto.updateMany).mockResolvedValue({ count: 0 })
    await expect(deleteOwnerLodgingPhoto('owner-1', 'lodging-1', 'photo-1')).resolves.toBe(false)
    expect(deleteUnreferencedFiles).not.toHaveBeenCalled()
  })

  it('enregistrer la personnalisation supprime les photos du guide retirées', async () => {
    mockGetSessionOwner.mockResolvedValue({ owner: { id: 'owner-1', role: 'owner' }, error: null })
    mockSaveCustomization.mockResolvedValue({ lodging_id: 'lodging-1' })
    jest.mocked(lodgingGuidePhotoUrls)
      .mockResolvedValueOnce(['https://x/cover-ancienne.webp', 'https://x/bloc.webp'])
      .mockResolvedValueOnce(['https://x/cover-nouvelle.webp', 'https://x/bloc.webp'])

    const res = await PUT(
      new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/customization', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_order: [], featured_pois: [] }),
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(deleteUnreferencedFiles).toHaveBeenCalledWith(['https://x/cover-ancienne.webp'])
  })
})
