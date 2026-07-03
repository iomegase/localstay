import {
  extractYouTubeId,
  youTubeEmbedUrl,
  youTubeThumbnailUrl,
  normalizeYouTubeUrl,
} from '@/shared/lib/youtube'

describe('extractYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['http://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abcDEF123', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
  ])('extracts the id from %s', (url, expected) => {
    expect(extractYouTubeId(url)).toBe(expected)
  })

  it.each([
    ['https://vimeo.com/123456789'],
    ['https://example.com/watch?v=dQw4w9WgXcQ'],
    ['not a url at all'],
    ['https://www.youtube.com/watch?v='],
    ['https://www.youtube.com/'],
    [''],
  ])('returns null for %s', url => {
    expect(extractYouTubeId(url)).toBeNull()
  })
})

describe('youTubeEmbedUrl', () => {
  it('builds a privacy-enhanced (nocookie) embed url', () => {
    expect(youTubeEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })
})

describe('youTubeThumbnailUrl', () => {
  it('builds the hqdefault thumbnail url', () => {
    expect(youTubeThumbnailUrl('dQw4w9WgXcQ')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
  })
})

describe('normalizeYouTubeUrl', () => {
  it('returns null for empty or whitespace input', () => {
    expect(normalizeYouTubeUrl('')).toBeNull()
    expect(normalizeYouTubeUrl('   ')).toBeNull()
    expect(normalizeYouTubeUrl(null)).toBeNull()
    expect(normalizeYouTubeUrl(undefined)).toBeNull()
  })

  it('returns the trimmed url for a valid YouTube link', () => {
    expect(normalizeYouTubeUrl('  https://youtu.be/dQw4w9WgXcQ  ')).toBe(
      'https://youtu.be/dQw4w9WgXcQ',
    )
  })

  it('throws for a non-YouTube url', () => {
    expect(() => normalizeYouTubeUrl('https://vimeo.com/123')).toThrow()
  })
})
