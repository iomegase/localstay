import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import {
  getLodgingCustomization,
  saveLodgingCustomization,
} from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'
import {
  countWords,
  normalizeOwnerNote,
  OWNER_NOTE_MAX_WORDS,
  WELCOME_MESSAGE_MAX_WORDS,
} from '@/features/guide-customization/lib/validation'
import { PRACTICAL_BLOCK_ICON_SLUGS } from '@/features/guide-customization/lib/practical-block-icons'
import { isTrashBinType } from '@/features/guide-customization/lib/trash-bins'
import { extractYouTubeId } from '@/shared/lib/youtube'

const trashBinSchema = z.object({
  type: z.string().trim().refine(isTrashBinType, { message: 'Type de bac inconnu' }),
})

const imageUrlSchema = z
  .union([
    z.string().trim().url(),
    z.string().trim().length(0).transform(() => null),
    z.null(),
  ])
  .optional()

const youtubeUrlSchema = z
  .union([
    z
      .string()
      .trim()
      .refine(value => extractYouTubeId(value) !== null, { message: 'Lien YouTube invalide' }),
    z.string().trim().length(0).transform(() => null),
    z.null(),
  ])
  .optional()
  .transform(value => value ?? null)

const ownerNoteSchema = z
  .string()
  .transform(value => normalizeOwnerNote(value))
  .refine(value => value === null || countWords(value) <= OWNER_NOTE_MAX_WORDS, {
    message: `Le commentaire ne doit pas dépasser ${OWNER_NOTE_MAX_WORDS} mots`,
  })
  .nullable()
  .optional()
  .transform(value => normalizeOwnerNote(value))

const featuredPoiSchema = z.object({
  poi_id: z.string().min(1),
  owner_note: ownerNoteSchema,
  sort_order: z.number().int().min(0),
})

const practicalText = (max: number) =>
  z.string().max(max).nullable().optional()

const practicalBlockSchema = z.object({
  id: z.string().optional(), // identifiant client (dnd) — ignoré à la persistance
  title: z
    .string()
    .trim()
    .min(1, 'Le titre du bloc est requis.')
    .max(120, 'Le titre du bloc doit faire 120 caracteres maximum.'),
  body: z
    .string()
    .max(4000)
    .nullable()
    .optional()
    .transform(value => (value && value.trim().length > 0 ? value : null)),
  icon: z
    .string()
    .trim()
    .refine(value => PRACTICAL_BLOCK_ICON_SLUGS.includes(value), { message: 'Icône inconnue' }),
  photo_url: z
    .union([
      z.string().trim().url(),
      z.string().trim().length(0).transform(() => null),
      z.null(),
    ])
    .optional()
    .transform(value => value ?? null),
  video_url: youtubeUrlSchema,
  sort_order: z.number().int().min(0),
})

const arrivalInstructionSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .trim()
    .max(120, "Le titre de l'étape doit faire 120 caractères maximum.")
    .nullable()
    .optional()
    .transform(value => (value && value.trim().length > 0 ? value.trim() : null)),
  text: z
    .string()
    .trim()
    .min(1, "Le texte de l'instruction est requis.")
    .max(2000, "L'instruction doit faire 2000 caractères maximum."),
  video_url: youtubeUrlSchema,
  photos: z.array(z.string().trim().url()).max(20).default([]),
  sort_order: z.number().int().min(0),
})

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
  cover_photo_url: imageUrlSchema,
  presentation_video_url: youtubeUrlSchema,
  lodging_address: practicalText(255),
  wifi_ssid: practicalText(120),
  wifi_password: practicalText(120),
  checkout_instructions: practicalText(4000),
  trash_info: practicalText(2000),
  trash_location: practicalText(500),
  house_rules: practicalText(4000),
  emergency_contacts: practicalText(2000),
  useful_services: practicalText(4000),
  practical_blocks: z.array(practicalBlockSchema).default([]),
  arrival_instructions: z.array(arrivalInstructionSchema).default([]),
  trash_bins: z.array(trashBinSchema).max(20).default([]),
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
