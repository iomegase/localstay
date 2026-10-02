import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'

type Context = { params: Promise<{ id: string }> }

const idSchema = z.string().uuid()
const bodySchema = z.object({
  key_box_code: z
    .string()
    .trim()
    .max(20, 'Le code de boîte à clés doit faire 20 caractères maximum.')
    .nullable()
    .transform(value => (value && value.length > 0 ? value : null)),
})
const noStore = { 'Cache-Control': 'no-store' }

/** Code de boîte à clés d'un logement, édité par l'admin (spec 054 AC-05-04). */
export async function GET(_request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const id = idSchema.safeParse((await context.params).id)
  if (!id.success) return validationError({ id: ['Identifiant invalide.'] })

  const customization = await prisma.lodgingCustomization.findFirst({
    where: { lodging_id: id.data, deleted_at: null },
    select: { key_box_code: true },
  })
  return NextResponse.json({ data: { key_box_code: customization?.key_box_code ?? null } }, { headers: noStore })
}

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const id = idSchema.safeParse((await context.params).id)
  if (!id.success) return validationError({ id: ['Identifiant invalide.'] })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.flatten())

  const lodging = await prisma.lodging.findFirst({ where: { id: id.data, deleted_at: null }, select: { id: true } })
  if (!lodging) return apiError('LODGING_NOT_FOUND', 'Logement introuvable.', 404)

  const saved = await prisma.lodgingCustomization.upsert({
    where: { lodging_id: id.data },
    update: { key_box_code: parsed.data.key_box_code },
    create: { lodging_id: id.data, category_order: [], key_box_code: parsed.data.key_box_code },
    select: { key_box_code: true },
  })
  return NextResponse.json({ data: { key_box_code: saved.key_box_code } }, { headers: noStore })
}
