import { z } from 'zod'

export const MerchantSearchSchema = z.object({
  q: z.string().trim().min(3).max(120),
})

export const MerchantClaimCreateSchema = z.object({
  poi_id: z.string().min(1),
})

export const MerchantClaimRejectSchema = z.object({
  admin_note: z.string().trim().min(1).max(500),
})

export const MerchantProfilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  hours: z.record(z.string(), z.unknown()).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  website: z.string().trim().url().nullable().optional(),
}).strict()

export const MerchantOfferCreateSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(200),
  ends_at: z.string().datetime(),
}).strict().refine(input => new Date(input.ends_at).getTime() > Date.now(), {
  message: 'ends_at must be in the future',
  path: ['ends_at'],
})

export type MerchantSearchInput = z.infer<typeof MerchantSearchSchema>
export type MerchantClaimCreateInput = z.infer<typeof MerchantClaimCreateSchema>
export type MerchantClaimRejectInput = z.infer<typeof MerchantClaimRejectSchema>
export type MerchantProfilePatchInput = z.infer<typeof MerchantProfilePatchSchema>
export type MerchantOfferCreateInput = z.infer<typeof MerchantOfferCreateSchema>
