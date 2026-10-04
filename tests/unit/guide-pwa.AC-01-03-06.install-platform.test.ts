import { detectInstallPlatform, detectIosBrowser } from '@/features/guide-pwa/lib/install-platform'

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPHONE_INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0'
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'
const IPHONE_EDGE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/130.0 Mobile/15E148 Safari/605.1.15'
const IPHONE_FIREFOX = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15'
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const ANDROID_FIREFOX = 'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0'
const ANDROID_FACEBOOK = 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0;]'
const DESKTOP_FIREFOX = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:130.0) Gecko/20100101 Firefox/130.0'

const env = (userAgent: string, overrides: Partial<Parameters<typeof detectInstallPlatform>[0]> = {}) => ({
  userAgent,
  standalone: false,
  hasNativePrompt: false,
  maxTouchPoints: 5,
  ...overrides,
})

describe('guide-pwa — mode d’installation selon l’appareil', () => {
  it('AC-01-06: déjà installé quand le guide est ouvert en standalone', () => {
    expect(detectInstallPlatform(env(ANDROID_CHROME, { standalone: true, hasNativePrompt: true }))).toBe('installed')
  })

  it('AC-01-03: invite native quand beforeinstallprompt est disponible', () => {
    expect(detectInstallPlatform(env(ANDROID_CHROME, { hasNativePrompt: true }))).toBe('native')
  })

  it('A1 AC-01-04: tutoriel iOS pour tous les navigateurs iPhone/iPad', () => {
    for (const ua of [IPHONE_SAFARI, IPHONE_CHROME, IPHONE_EDGE, IPHONE_FIREFOX, IPAD_DESKTOP_UA]) {
      expect(detectInstallPlatform(env(ua))).toBe('ios')
    }
  })

  it('A1 AC-01-07: Android sans invite native → menu du navigateur', () => {
    expect(detectInstallPlatform(env(ANDROID_FIREFOX))).toBe('android-menu')
    expect(detectInstallPlatform(env(ANDROID_CHROME))).toBe('android-menu')
  })

  it('A1 AC-01-05: navigateurs intégrés des apps, et ordinateur sans invite native', () => {
    expect(detectInstallPlatform(env(IPHONE_INSTAGRAM))).toBe('unsupported')
    expect(detectInstallPlatform(env(ANDROID_FACEBOOK))).toBe('unsupported')
    expect(detectInstallPlatform(env(IPAD_DESKTOP_UA, { maxTouchPoints: 0 }))).toBe('unsupported')
    expect(detectInstallPlatform(env(DESKTOP_FIREFOX, { maxTouchPoints: 0 }))).toBe('unsupported')
  })
})

describe('A1 AC-01-04 — navigateur iOS', () => {
  it('reconnaît Brave via navigator.brave (UA identique à Safari)', () => {
    expect(detectIosBrowser(IPHONE_SAFARI, true)).toBe('brave')
  })

  it.each([
    [IPHONE_CHROME, 'chrome'],
    [IPHONE_EDGE, 'edge'],
    [IPHONE_FIREFOX, 'firefox'],
    [IPHONE_SAFARI, 'safari-or-unknown'],
  ])('%s → %s', (ua, expected) => {
    expect(detectIosBrowser(ua, false)).toBe(expected)
  })
})
