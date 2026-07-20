import { estimateBlogReadingMinutes } from '@/features/blog/lib/reading-time'

describe('029 blog article reading time', () => {
  it('returns at least one minute and rounds up at 200 words per minute', () => {
    expect(estimateBlogReadingMinutes('court article')).toBe(1)
    expect(estimateBlogReadingMinutes(Array.from({ length: 201 }, () => 'mot').join(' '))).toBe(2)
  })
})
