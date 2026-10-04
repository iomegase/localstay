export type SyncSummary = {
  fetched: number
  created: number
  updated: number
  deleted: number
}

export type AdminGoogleReviewDto = {
  id: string
  google_review_id: string
  author: string
  author_photo_url: string | null
  rating: number
  comment: string | null
  owner_reply: string | null
  google_created_at: string
  published_destination_ids: string[]
}

export type AdminGoogleReviewsData = {
  reviews: AdminGoogleReviewDto[]
  destinations: { id: string; name: string }[]
  lastSyncedAt: string | null
  configured: boolean
}
