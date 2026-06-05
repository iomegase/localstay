import { reliabilityFromQualityStatus } from '@/features/trails-acquisition/lib/geometry-quality'

describe('reliabilityFromQualityStatus', () => {
  it('treats only "complete" as reliable', () => {
    expect(reliabilityFromQualityStatus('complete')).toBe('reliable')
  })

  it('treats incomplete / needs_review / indicative / unknown as indicative', () => {
    expect(reliabilityFromQualityStatus('incomplete')).toBe('indicative')
    expect(reliabilityFromQualityStatus('needs_review')).toBe('indicative')
    expect(reliabilityFromQualityStatus('indicative')).toBe('indicative')
    expect(reliabilityFromQualityStatus('whatever')).toBe('indicative')
  })
})
