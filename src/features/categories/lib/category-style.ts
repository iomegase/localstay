const CATEGORY_COLORS: Record<string, string> = {
  cafes: '#7A5C43',
  cafe: '#7A5C43',
  diner: '#E58B3C',
  restaurants: '#E58B3C',
  restaurant: '#E58B3C',
  rando: '#4F8A54',
  randonnees: '#4F8A54',
  randonnee: '#4F8A54',
  soin: '#D96B86',
  soins: '#D96B86',
  spa: '#D96B86',
  shopping: '#8062B0',
  culture: '#5B8CC0',
  loisirs: '#4C9AA6',
  bars: '#8A3F67',
  bar: '#8A3F67',
  mobilite: '#6E7378',
  transport: '#6E7378',
  famille: '#4F9A9A',
  urgences: '#B94A48',
  urgence: '#B94A48',
}

const DEFAULT_CATEGORY_COLOR = '#455E4C'

export function getCategoryColor(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_CATEGORY_COLOR
  return CATEGORY_COLORS[slug.toLowerCase()] ?? DEFAULT_CATEGORY_COLOR
}
