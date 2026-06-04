import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import {
  getLodgingCustomization,
  saveLodgingCustomization,
} from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'
import { countWords, WELCOME_MESSAGE_MAX_WORDS } from '@/features/guide-customization/lib/validation'

const featuredPoiSchema = z.object({
  poi_id: z.string().min(1),
  sort_order: z.number().int().min(0),
})

const practicalText = (max: number) =>
  z.string().max(max).nullable().optional()

const customizationSchema = z.object({
  welcome_message: z
    .string()
    .refine(value => countWords(value) <= WELCOME_MESSAGE_MAX_WORDS, {
      message: `Le message d'accueil ne doit pas dépasser ${WELCOME_MESSAGE_MAX_WORDS} mots`,
    })
    .nullable()
    .optional(),
  category_order: z.array(z.string().min(1)).default([]),
  featured_pois: z.array(featuredPoiSchema).max(100).default([]),
  // Spec 012 — Infos pratiques et photo logement
  cover_photo_url: z.union([
    z.string().trim().url(),
    z.string().trim().length(0).transform(() => null),
    z.null(),
  ]).optional(),
  lodging_address: practicalText(255),
  wifi_ssid: practicalText(120),
  wifi_password: practicalText(120),
  parking_info: practicalText(2000),
  equipment_info: practicalText(4000),
  checkout_instructions: practicalText(4000),
  trash_info: practicalText(2000),
  trash_location: practicalText(500),
  house_rules: practicalText(4000),
  emergency_contacts: practicalText(2000),
  useful_services: practicalText(4000),
})

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details: details ?? {} } },
    { status },
  )
}

function mapCustomizationError(error: unknown): NextResponse {
  const code = error instanceof GuideCustomizationError
    ? error.code
    : error instanceof Error
      ? error.message
      : 'INTERNAL_ERROR'

  if (code === 'FORBIDDEN') {
    return errorResponse('FORBIDDEN', 'Acces interdit', 403)
  }

  if (code === 'NOT_FOUND') {
    return errorResponse('NOT_FOUND', 'Logement introuvable', 404)
  }

  if (code === 'FEATURED_POI_LIMIT_EXCEEDED') {
    return errorResponse('FEATURED_POI_LIMIT_EXCEEDED', 'Maximum 5 POI mis en avant par categorie', 400)
  }

  if (code === 'INVALID_FEATURED_POI') {
    return errorResponse('INVALID_FEATURED_POI', 'POI invalide pour ce guide', 400)
  }

  return errorResponse('INTERNAL_ERROR', 'Erreur interne', 500)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const { id } = await params

  try {
    const customization = await getLodgingCustomization(session.owner.id, id)
    return NextResponse.json(customization)
  } catch (error) {
    return mapCustomizationError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const body = await req.json().catch(() => null)
  const parsed = customizationSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse('INVALID_BODY', 'Payload invalide', 400, parsed.error.flatten())
  }

  const { id } = await params

  try {
    const customization = await saveLodgingCustomization(session.owner.id, id, parsed.data)
    return NextResponse.json(customization)
  } catch (error) {
    return mapCustomizationError(error)
  }
}
