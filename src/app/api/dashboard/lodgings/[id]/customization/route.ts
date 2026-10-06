import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import {
  getLodgingCustomization,
  saveLodgingCustomization,
} from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'
import {
  arrivalStepHasContent,
  countWords,
  EMPTY_ARRIVAL_STEP_MESSAGE,
  normalizeOwnerNote,
  OWNER_NOTE_MAX_WORDS,
} from '@/features/guide-customization/lib/validation'
import { PRACTICAL_BLOCK_ICON_SLUGS } from '@/features/guide-customization/lib/practical-block-icons'
import { extractYouTubeId } from '@/shared/lib/youtube'
import {
  arrivalMediaCount,
  ARRIVAL_STEP_ITEMS_MAX,
  ARRIVAL_STEP_MAX_MEDIA,
  ARRIVAL_STEP_KINDS,
  arrivalFactSchema,
  arrivalSubstepSchema,
} from '@/features/guide-app/lib/arrival-steps'
import { lodgingGuidePhotoUrls } from '@/features/storage-cleanup/queries/references'
import { deleteUnreferencedFiles } from '@/features/storage-cleanup/services/delete-files'
import { removedUrls } from '@/features/storage-cleanup/lib/storage-paths'

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
  id: z.string().optional(), // UUID persistant ou identifiant UI préfixé tmp-
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
  // Spec 083 AC-01-04 : texte facultatif (une étape entièrement vide reste refusée, ci-dessous).
  text: z
    .string()
    .trim()
    .max(2000, "L'instruction doit faire 2000 caractères maximum.")
    .nullable()
    .optional()
    .transform(value => value ?? ''),
  video_url: youtubeUrlSchema,
  photos: z.array(z.string().trim().url()).max(ARRIVAL_STEP_MAX_MEDIA).default([]),
  sort_order: z.number().int().min(0),
  // Spec 054 AC-05-01 — étapes typées.
  kind: z.enum(ARRIVAL_STEP_KINDS).default('custom'),
  tip: z
    .string()
    .trim()
    .max(300, 'Le conseil doit faire 300 caractères maximum.')
    .nullable()
    .optional()
    .transform(value => (value && value.length > 0 ? value : null)),
  substeps: z
    .array(arrivalSubstepSchema.extend({ title: z.string().trim().max(120) }))
    .max(ARRIVAL_STEP_ITEMS_MAX)
    .default([]),
  facts: z
    .array(arrivalFactSchema.extend({ label: z.string().trim().max(40), value: z.string().trim().max(60) }))
    .max(ARRIVAL_STEP_ITEMS_MAX)
    .default([]),
}).refine(arrivalStepHasContent, { message: EMPTY_ARRIVAL_STEP_MESSAGE, path: ['text'] }).refine(
  instruction => arrivalMediaCount(instruction.photos, instruction.video_url) <= ARRIVAL_STEP_MAX_MEDIA,
  {
    message: `${ARRIVAL_STEP_MAX_MEDIA} médias maximum par étape : 1 image principale + 4 photos ou vidéo.`,
    path: ['photos'],
  },
)

// Spec 077 : message d'accueil, bacs et texte « déchets » retirés (ignorés s'ils sont envoyés).
const customizationSchema = z.object({
  category_order: z.array(z.string().min(1)).default([]),
  featured_pois: z.array(featuredPoiSchema).max(100).default([]),
  // Spec 012 — Infos pratiques et photo logement
  cover_photo_url: imageUrlSchema,
  presentation_video_url: youtubeUrlSchema,
  lodging_address: practicalText(255),
  // Spec 080 : adresse structurée ; lodging_address est alors recomposée.
  address_number: practicalText(10),
  address_street: practicalText(200),
  address_postal_code: z.string().trim().regex(/^(\d{5})?$/, 'Le code postal doit contenir 5 chiffres.').nullable().optional(),
  address_city: practicalText(120),
  wifi_ssid: practicalText(120),
  wifi_password: practicalText(120),
  // Spec 054 AC-05-02 — code de boîte à clés, affiché masqué dans le guide privé.
  key_box_code: z
    .string()
    .trim()
    .max(20, 'Le code de boîte à clés doit faire 20 caractères maximum.')
    .nullable()
    .optional()
    .transform(value => (value === undefined ? undefined : value && value.length > 0 ? value : null)),
  checkout_instructions: practicalText(4000),
  trash_location: practicalText(500),
  house_rules: practicalText(4000),
  emergency_contacts: practicalText(2000),
  useful_services: practicalText(4000),
  practical_blocks: z.array(practicalBlockSchema).default([]),
  arrival_instructions: z.array(arrivalInstructionSchema).default([]),
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

  if (code === 'INVALID_CHILD_ITEM_ID') {
    return errorResponse('INVALID_CHILD_ITEM_ID', 'Élément du guide invalide', 400)
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
    // Spec 083 AC-01-02 : chemin exact de chaque erreur, pour l'afficher sous le bon champ.
    return errorResponse('INVALID_BODY', 'Payload invalide', 400, {
      ...parsed.error.flatten(),
      issues: parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
    })
  }

  const { id } = await params

  try {
    // Spec 070 AC-03-02 : photos du guide retirées → fichiers supprimés.
    const previousPhotos = await lodgingGuidePhotoUrls(id)
    const customization = await saveLodgingCustomization(session.owner.id, id, parsed.data)
    await deleteUnreferencedFiles(removedUrls(previousPhotos, await lodgingGuidePhotoUrls(id)))
    return NextResponse.json(customization)
  } catch (error) {
    return mapCustomizationError(error)
  }
}
