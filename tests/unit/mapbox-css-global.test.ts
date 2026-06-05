import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Mapbox GL global CSS', () => {
  it('loads mapbox-gl.css from the root app layout for every Mapbox route', () => {
    const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')

    expect(layout).toContain("import 'mapbox-gl/dist/mapbox-gl.css'")
  })
})
