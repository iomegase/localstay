import { getFavoriteBentoVariant } from '@/features/guide-app/lib/favorite-bento'

describe('getFavoriteBentoVariant', () => {
  it('assigns the big variant to the first POI and compact to the rest', () => {
    expect(getFavoriteBentoVariant(0)).toBe('big')
    expect(getFavoriteBentoVariant(1)).toBe('compact')
    expect(getFavoriteBentoVariant(2)).toBe('compact')
    expect(getFavoriteBentoVariant(13)).toBe('compact')
  })
})
