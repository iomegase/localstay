import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { createSubCategory } from '@/features/admin-taxonomy/queries/taxonomy'
import {
  parsedOrValidationError,
  readJson,
  responseFromTaxonomyError,
  SubCategoryCreateSchema,
} from '@/features/admin-taxonomy/lib/api'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(SubCategoryCreateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  const { id } = await params
  try {
    const data = await createSubCategory(id, parsed, session.user.id)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return responseFromTaxonomyError(error)
  }
}
