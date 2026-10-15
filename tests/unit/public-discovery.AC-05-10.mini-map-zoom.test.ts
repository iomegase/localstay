import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('041 AC-05-10 — zoom de la mini-carte des fiches lieu', () => {
  it('requests the static map at zoom 19', () => {
    const source = readFileSync(join(process.cwd(), 'src/features/public-discovery/components/DiscoveryPoiView.tsx'), 'utf8')
    expect(source).toMatch(/<MiniMap [^>]*zoom=\{19\}/)
  })
})

describe('041 AC-05-11 — typographie des fiches lieu', () => {
  it('uses a 45px title and 14px description paragraphs', () => {
    const source = readFileSync(join(process.cwd(), 'src/features/public-discovery/components/DiscoveryPoiView.tsx'), 'utf8')
    expect(source).toMatch(/<h1 className="text-\[45px\][^"]*">\{poi\.name\}<\/h1>/)
    expect(source).not.toMatch(/<h1 className="[^"]*sm:text-6xl/)
    expect(source).toContain('[&_p]:text-[14px]')
    expect(source).not.toContain('[&_p]:text-base')
  })
})
