/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseGtfsStatic } from '@/features/transport/lib/gtfs-static'
import { buildLines } from '@/features/transport/lib/lines'
import { readZipEntries } from '@/features/transport/lib/zip'

const gtfs = parseGtfsStatic(readZipEntries(readFileSync(path.join(__dirname, '../fixtures/facilibus/gtfs-pub.zip'))))

describe('058 AC-01-01 — line shapes', () => {
  it('builds one line per route with its official colour and deduplicated [lng, lat] paths', () => {
    const lines = buildLines(gtfs)
    expect(lines.map(line => [line.shortName, line.color])).toEqual([['1', '#228947'], ['2', '#e72438']])
    for (const line of lines) {
      expect(line.paths.length).toBeGreaterThanOrEqual(1)
      expect(line.paths.length).toBeLessThanOrEqual(2)
      const [lng, lat] = line.paths[0][0]
      expect(lng).toBeGreaterThan(6.6)
      expect(lng).toBeLessThan(6.8)
      expect(lat).toBeGreaterThan(45.8)
      expect(lat).toBeLessThan(45.95)
      expect(line.paths[0].length).toBeGreaterThan(20)
    }
  })
})
