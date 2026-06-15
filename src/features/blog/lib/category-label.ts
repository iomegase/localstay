import type { BlogArticleCategory } from '../types'

const CATEGORY_LABELS: Record<BlogArticleCategory, string> = {
  local_guide: 'Guide local',
  lodging: 'Hébergement',
  restaurants: 'Restaurants',
  activities: 'Activités',
  travel_tips: 'Conseils voyage',
}

export function blogCategoryLabel(category: BlogArticleCategory): string {
  return CATEGORY_LABELS[category]
}
