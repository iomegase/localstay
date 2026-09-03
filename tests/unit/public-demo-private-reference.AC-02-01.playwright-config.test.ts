/** @jest-environment node */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('045 demo Playwright server isolation', () => {
  const configSource = readFileSync(
    join(process.cwd(), 'playwright.config.ts'),
    'utf8',
  )

  it('starts its own local server instead of reusing an existing one when no external base URL is provided', () => {
    expect(configSource).toContain("baseURL: externalBaseUrl ?? 'http://localhost:3000'")
    expect(configSource).toContain("command: 'npm run dev'")
    expect(configSource).toContain("url: 'http://localhost:3000'")
    expect(configSource).toContain('reuseExistingServer: false')
  })

  it('keeps PLAYWRIGHT_BASE_URL as the only bypass for the local server', () => {
    expect(configSource).toContain('webServer: externalBaseUrl')
    expect(configSource).toContain('? undefined')
  })
})
