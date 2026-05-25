import { assertAllowedTrailSource } from '@/features/trails-acquisition/lib/source-policy'

describe('019 trails acquisition source policy', () => {
  it('rejects AllTrails URLs', () => {
    expect(() => assertAllowedTrailSource('https://www.alltrails.com/trail/france/foo')).toThrow(
      'SOURCE_NOT_ALLOWED',
    )
  })

  it('rejects invalid URL values', () => {
    expect(() => assertAllowedTrailSource('not-a-url')).toThrow('SOURCE_NOT_ALLOWED')
  })

  it('accepts official local URLs', () => {
    expect(assertAllowedTrailSource('https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/')).toBe(
      true,
    )
  })
})
