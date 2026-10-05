import { execFileSync } from 'node:child_process'

function configFor(mode: string) {
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', 'import config from "./next.config.mjs"; console.log(JSON.stringify(config.images))'], {
    cwd: process.cwd(), env: { ...process.env, NODE_ENV: mode }, encoding: 'utf8',
  }))
}

it('loads original images in development when NAT64 would block the optimizer', () => {
  expect(configFor('development').unoptimized).toBe(true)
})
it('retains production optimization and the private IP protection', () => {
  const images = configFor('production')
  expect(images.unoptimized).toBe(false)
  expect(images.dangerouslyAllowLocalIP).not.toBe(true)
  expect(images.remotePatterns).toContainEqual({ protocol: 'https', hostname: '**.supabase.co' })
})
