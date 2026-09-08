export type GuestReview = {
  id: string
  quote: string
  author: string
  stayDate?: string
  source?: 'airbnb' | 'direct'
  rating?: number
}

// Les avis sont ajoutés manuellement après vérification de leur source.
const guestReviewsByDestination: Readonly<Record<string, GuestReview[]>> = {
  'saint-gervais-les-bains': [],
  'saint-nicolas-de-veroce': [],
}

export function getGuestReviewsForDestination(slug: string): GuestReview[] {
  return guestReviewsByDestination[slug] ?? []
}
