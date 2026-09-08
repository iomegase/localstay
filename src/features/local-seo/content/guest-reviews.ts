export type GuestReview = {
  id: string
  quote: string
  author: string
  stayDate?: string
  source?: 'AIRBNB' | 'DIRECT'
  rating?: number
}
