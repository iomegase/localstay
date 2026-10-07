// Spec 089 BR-04 : contrôle d'un lien iCal saisi par l'Owner (utilisable côté client et serveur).

const IPV4_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/

/** https, nom de domaine public (pas d'IP littérale ni de nom local). */
export function isSafePublicHttpsUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  if (!host.includes('.') || host.includes(':') || host.startsWith('[') || IPV4_LITERAL.test(host)) return false
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false
  return true
}

/** Adresse résolue publique ? (refuse privé, boucle locale, lien local, CGNAT, multicast…) */
export function isPublicIpAddress(address: string): boolean {
  const ip = address.toLowerCase()
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return isPublicIpAddress(mapped[1]!)
  if (IPV4_LITERAL.test(ip)) {
    const [a, b] = ip.split('.').map(Number) as [number, number]
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false
    if (a === 169 && b === 254) return false
    if (a === 172 && b >= 16 && b <= 31) return false
    if (a === 192 && b === 168) return false
    if (a === 100 && b >= 64 && b <= 127) return false
    return true
  }
  if (ip === '::' || ip === '::1') return false
  if (/^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith('ff')) return false
  return ip.includes(':')
}
