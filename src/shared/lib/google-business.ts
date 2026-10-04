import { z } from 'zod'

// Spec 062 — client Google Business Profile (OAuth refresh token + API v4 des avis).

export type GoogleBusinessConfig = {
  clientId: string
  clientSecret: string
  refreshToken: string
  accountId: string
  locationId: string
}

export type NormalizedGoogleReview = {
  google_review_id: string
  author: string
  author_photo_url: string | null
  rating: number
  comment: string | null
  owner_reply: string | null
  google_created_at: Date
  google_updated_at: Date
}

export class GoogleBusinessError extends Error {
  constructor(public readonly code: 'GOOGLE_NOT_CONFIGURED' | 'GOOGLE_API_ERROR', message: string) {
    super(message)
    this.name = 'GoogleBusinessError'
  }
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVIEWS_URL = 'https://mybusiness.googleapis.com/v4'
const PAGE_SIZE = 50
const MAX_PAGES = 100
const ANONYMOUS_AUTHOR = 'Utilisateur Google'
const STAR_RATINGS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const

const TokenSchema = z.object({ access_token: z.string().min(1) })

const RawReviewSchema = z.object({
  name: z.string().min(1),
  reviewer: z.object({
    displayName: z.string().optional(),
    profilePhotoUrl: z.string().optional(),
  }).optional(),
  starRating: z.enum(['STAR_RATING_UNSPECIFIED', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']),
  comment: z.string().optional(),
  createTime: z.string().datetime({ offset: true }),
  updateTime: z.string().datetime({ offset: true }),
  reviewReply: z.object({ comment: z.string().optional() }).optional(),
})

const RawPageSchema = z.object({
  reviews: z.array(RawReviewSchema).optional(),
  nextPageToken: z.string().optional(),
})

type RawReview = z.infer<typeof RawReviewSchema>
type RatedRawReview = RawReview & { starRating: keyof typeof STAR_RATINGS }

export function googleBusinessConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GoogleBusinessConfig | null {
  const clientId = env.GOOGLE_BUSINESS_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim()
  const refreshToken = env.GOOGLE_BUSINESS_REFRESH_TOKEN?.trim()
  const accountId = env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim()
  const locationId = env.GOOGLE_BUSINESS_LOCATION_ID?.trim()
  if (!clientId || !clientSecret || !refreshToken || !accountId || !locationId) return null
  return { clientId, clientSecret, refreshToken, accountId, locationId }
}

/** Google ajoute sa traduction au texte : on garde celui écrit par l'auteur. */
function originalComment(comment: string | undefined): string | null {
  if (!comment?.trim()) return null
  const originalMarker = '(Original)'
  const translatedMarker = '(Translated by Google)'
  let text = comment
  if (text.includes(originalMarker)) text = text.slice(text.indexOf(originalMarker) + originalMarker.length)
  else if (text.includes(translatedMarker)) text = text.slice(0, text.indexOf(translatedMarker))
  return text.trim() || null
}

function normalize(raw: RatedRawReview): NormalizedGoogleReview {
  return {
    google_review_id: raw.name,
    author: raw.reviewer?.displayName?.trim() || ANONYMOUS_AUTHOR,
    author_photo_url: raw.reviewer?.profilePhotoUrl ?? null,
    rating: STAR_RATINGS[raw.starRating],
    comment: originalComment(raw.comment),
    owner_reply: raw.reviewReply?.comment?.trim() || null,
    google_created_at: new Date(raw.createTime),
    google_updated_at: new Date(raw.updateTime),
  }
}

function isRated(raw: RawReview): raw is RatedRawReview {
  return raw.starRating !== 'STAR_RATING_UNSPECIFIED'
}

async function request(fetchImpl: typeof fetch, url: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetchImpl(url, init)
  } catch {
    throw new GoogleBusinessError('GOOGLE_API_ERROR', 'Google Business Profile est injoignable.')
  }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const invalidGrant = typeof body === 'object' && body !== null && 'error' in body && body.error === 'invalid_grant'
    throw new GoogleBusinessError('GOOGLE_API_ERROR', invalidGrant
      ? 'Autorisation Google révoquée ou expirée : relancez scripts/google-business-auth.ts et mettez à jour GOOGLE_BUSINESS_REFRESH_TOKEN.'
      : `Google Business Profile a répondu ${response.status}.`)
  }
  return body
}

async function accessToken(config: GoogleBusinessConfig, fetchImpl: typeof fetch): Promise<string> {
  const body = await request(fetchImpl, TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const parsed = TokenSchema.safeParse(body)
  if (!parsed.success) throw new GoogleBusinessError('GOOGLE_API_ERROR', 'Réponse OAuth Google inattendue.')
  return parsed.data.access_token
}

export async function fetchAllGoogleReviews(
  config: GoogleBusinessConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedGoogleReview[]> {
  const token = await accessToken(config, fetchImpl)
  const base = `${REVIEWS_URL}/accounts/${encodeURIComponent(config.accountId)}/locations/${encodeURIComponent(config.locationId)}/reviews?pageSize=${PAGE_SIZE}`
  const reviews: NormalizedGoogleReview[] = []
  let pageToken: string | undefined

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = pageToken ? `${base}&pageToken=${encodeURIComponent(pageToken)}` : base
    const parsed = RawPageSchema.safeParse(await request(fetchImpl, url, { headers: { Authorization: `Bearer ${token}` } }))
    if (!parsed.success) throw new GoogleBusinessError('GOOGLE_API_ERROR', 'Réponse Google Business Profile inattendue.')
    reviews.push(...(parsed.data.reviews ?? []).filter(isRated).map(normalize))
    if (!parsed.data.nextPageToken) return reviews
    pageToken = parsed.data.nextPageToken
  }
  throw new GoogleBusinessError('GOOGLE_API_ERROR', `Pagination Google interrompue après ${MAX_PAGES} pages.`)
}
