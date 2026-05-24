import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { createCategory } from '@/features/admin-taxonomy/queries/taxonomy'
import {
  CategoryCreateSchema,
  parsedOrValidationError,
  readJson,
  responseFromTaxonomyError,
  validateIconSlug,
} from '@/features/admin-taxonomy/lib/api'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(CategoryCreateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  const iconError = validateIconSlug(parsed.icon)
  if (iconError) return iconError

  try {
    const data = await createCategory(parsed, session.user.id)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return responseFromTaxonomyError(error)
  }
}
