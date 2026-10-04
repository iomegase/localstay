/** Spec 059 AC-01-03 à AC-01-06 : parcours d'installation selon l'appareil. */
export type InstallPlatform = 'installed' | 'native' | 'ios' | 'unsupported'

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

  const isIPhoneOrIPad = /\b(iPhone|iPad|iPod)\b/.test(userAgent)
  // iPadOS se présente comme un Mac : on le reconnaît à son écran tactile.
  const isIPadDesktopMode = /\bMacintosh\b/.test(userAgent) && maxTouchPoints > 1
  if ((isIPhoneOrIPad || isIPadDesktopMode) && /Safari\//.test(userAgent)) return 'ios'

  return 'unsupported'
}
