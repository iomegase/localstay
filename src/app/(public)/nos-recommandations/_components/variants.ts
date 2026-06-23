export type RecRow = {
  poi_id: string
  owner_note: string | null
  poi: {
    id: string
    name: string
    slug: string
    description: string | null
    photos: string[]
    category: { name: string; slug: string }
    city?: { slug: string; name: string } | null
  }
}

export type CardVariant = 'bigImage' | 'image' | 'white' | 'sand' | 'note'
export type AssignedCard = { row: RecRow; variant: CardVariant }

export function hasPhoto(row: RecRow): boolean {
  return Boolean(row.poi.photos?.[0])
}

export function hasNote(row: RecRow): boolean {
  return Boolean(row.owner_note && row.owner_note.trim().length > 0)
}

const TEXT_CYCLE = ['image', 'white', 'sand'] as const

export function assignVariants(rows: RecRow[]): AssignedCard[] {
  return rows.map((row, i) => {
    if (i === 0) {
      const variant: CardVariant = hasPhoto(row) ? 'bigImage' : hasNote(row) ? 'note' : 'white'
      return { row, variant }
    }
    const base = TEXT_CYCLE[(i - 1) % TEXT_CYCLE.length]
    if (base === 'image') {
      const variant: CardVariant = hasPhoto(row) ? 'image' : hasNote(row) ? 'note' : 'white'
      return { row, variant }
    }
    return { row, variant: base }
  })
}
