/** Spec 059 AC-01-03 à AC-01-07 (amendement A1) : parcours d'installation selon l'appareil. */
export type InstallPlatform = 'installed' | 'native' | 'ios' | 'android-menu' | 'unsupported'
export type IosBrowser = 'brave' | 'chrome' | 'edge' | 'firefox' | 'safari-or-unknown'

type InstallEnvironment = {
  userAgent: string
  standalone: boolean
  hasNativePrompt: boolean
  maxTouchPoints: number
}

// Navigateurs intégrés aux apps (lecteurs QR, réseaux sociaux) : pas d'installation.
const IN_APP_BROWSER = /\b(FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|Snapchat|TikTok|musical_ly|Twitter|MicroMessenger|GSA\/|; wv\))/i

export function detectInstallPlatform({
  userAgent,
  standalone,
  hasNativePrompt,
  maxTouchPoints,
}: InstallEnvironment): InstallPlatform {
  if (standalone) return 'installed'
  if (hasNativePrompt) return 'native'
  if (IN_APP_BROWSER.test(userAgent)) return 'unsupported'

  // iPadOS se présente comme un Mac : on le reconnaît à son écran tactile.
  const isIPadDesktopMode = /\bMacintosh\b/.test(userAgent) && maxTouchPoints > 1
  if (/\b(iPhone|iPad|iPod)\b/.test(userAgent) || isIPadDesktopMode) return 'ios'
  if (/\bAndroid\b/.test(userAgent)) return 'android-menu'

  return 'unsupported'
}

/** Brave iOS a le même user agent que Safari : on le reconnaît à `navigator.brave`. */
export function detectIosBrowser(userAgent: string, isBrave: boolean): IosBrowser {
  if (isBrave) return 'brave'
  if (/\bCriOS\//.test(userAgent)) return 'chrome'
  if (/\bEdgiOS\//.test(userAgent)) return 'edge'
  if (/\bFxiOS\//.test(userAgent)) return 'firefox'
  return 'safari-or-unknown'
}
