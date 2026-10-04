import { detectInstallPlatform } from '@/features/guide-pwa/lib/install-platform'

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPHONE_INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0'
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const ANDROID_FACEBOOK = 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0;]'

describe('guide-pwa — mode d’installation selon l’appareil', () => {
  it('AC-01-06: déjà installé quand le guide est ouvert en standalone', () => {
    expect(detectInstallPlatform({ userAgent: ANDROID_CHROME, standalone: true, hasNativePrompt: true, maxTouchPoints: 5 })).toBe('installed')
  })

  it('AC-01-03: invite native quand beforeinstallprompt est disponible', () => {
    expect(detectInstallPlatform({ userAgent: ANDROID_CHROME, standalone: false, hasNativePrompt: true, maxTouchPoints: 5 })).toBe('native')
  })

  it('AC-01-04: tutoriel iOS sur Safari iPhone (et iPad en UA bureau)', () => {
    expect(detectInstallPlatform({ userAgent: IPHONE_SAFARI, standalone: false, hasNativePrompt: false, maxTouchPoints: 5 })).toBe('ios')
    expect(detectInstallPlatform({ userAgent: IPAD_DESKTOP_UA, standalone: false, hasNativePrompt: false, maxTouchPoints: 5 })).toBe('ios')
  })

  it('AC-01-05: navigateur intégré ou sans installation possible', () => {
    expect(detectInstallPlatform({ userAgent: IPHONE_INSTAGRAM, standalone: false, hasNativePrompt: false, maxTouchPoints: 5 })).toBe('unsupported')
    expect(detectInstallPlatform({ userAgent: ANDROID_FACEBOOK, standalone: false, hasNativePrompt: false, maxTouchPoints: 5 })).toBe('unsupported')
    expect(detectInstallPlatform({ userAgent: IPAD_DESKTOP_UA, standalone: false, hasNativePrompt: false, maxTouchPoints: 0 })).toBe('unsupported')
  })

  it('Chrome iOS ≥ 16.4 propose aussi « Sur l’écran d’accueil » via Partager', () => {
    expect(detectInstallPlatform({ userAgent: IPHONE_CHROME, standalone: false, hasNativePrompt: false, maxTouchPoints: 5 })).toBe('ios')
  })
})
