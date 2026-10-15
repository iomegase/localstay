import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('041 AC-05-10 — zoom de la mini-carte des fiches lieu', () => {
  it('requests the static map at zoom 19', () => {
    const source = readFileSync(join(process.cwd(), 'src/features/public-discovery/components/DiscoveryPoiView.tsx'), 'utf8')
    expect(source).toMatch(/<MiniMap [^>]*zoom=\{19\}/)
  })
})
