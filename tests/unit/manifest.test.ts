import manifest from '@/app/manifest'

describe('PWA manifest', () => {
  it('opens standalone (chrome-less) with the MyStay theme and icons', () => {
    const result = manifest()

    expect(result.display).toBe('standalone')
    expect(result.short_name).toBe('MyStay')
    expect(result.start_url).toBe('/')
    expect(result.theme_color).toBe('#FAF9F6')
    expect(result.background_color).toBe('#FAF9F6')

    const purposes = result.icons?.map(icon => icon.purpose)
    expect(purposes).toContain('any')
    expect(purposes).toContain('maskable')
    expect(result.icons?.every(icon => icon.sizes === '512x512')).toBe(true)
  })
})
