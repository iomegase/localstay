import { readFileSync } from 'fs'
import { join } from 'path'

describe('mobile browser immersive mode', () => {
  it('configures the root layout for mobile browser chrome collapse', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')

    expect(layout).toContain("import { MobileBrowserChromeCollapser }")
    expect(layout).toContain('export const viewport')
    expect(layout).toContain("viewportFit: 'cover'")
    expect(layout).toContain("themeColor: '#FAF9F6'")
    expect(layout).not.toMatch(/maximumScale\s*:/)
    expect(layout).not.toMatch(/userScalable\s*:/)
    expect(layout).toContain('<MobileBrowserChromeCollapser />')
  })

  it('keeps a mobile immersive viewport stylesheet hook', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    const component = readFileSync(
      join(process.cwd(), 'src/shared/components/MobileBrowserChromeCollapser.tsx'),
      'utf8',
    )

    expect(css).toContain('body.mobile-browser-immersive')
    expect(css).toContain('--mystay-viewport-height')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(component).toContain("document.body.classList.add('mobile-browser-immersive')")
    expect(component).toContain('window.scrollTo(0, 1)')
  })
})
