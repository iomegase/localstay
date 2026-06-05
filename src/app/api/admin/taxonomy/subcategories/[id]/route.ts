import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { deleteSubCategory, updateSubCategory } from '@/features/admin-taxonomy/queries/taxonomy'
import {
  parsedOrValidationError,
  readJson,
  responseFromTaxonomyError,
  SubCategoryPatchSchema,
} from '@/features/admin-taxonomy/lib/api'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(SubCategoryPatchSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  const { id } = await params
  try {
    const data = await updateSubCategory(id, parsed, session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromTaxonomyError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  try {
    const data = await deleteSubCategory(id, session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromTaxonomyError(error)
  }
}
