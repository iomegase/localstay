import { isPublicIpAddress, isSafePublicHttpsUrl } from '@/features/lodging-showcase/lib/ical-url'
import { fetchIcal } from '@/features/lodging-showcase/queries/availability'

jest.mock('@/shared/lib/prisma', () => ({ prisma: {} }))
jest.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))

const ICS = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR'
const ok = (body: string, headers: Record<string, string> = {}) => new Response(body, { status: 200, headers })
const publicDns = async () => ['52.0.0.1']

describe('spec 089 BR-04 — lecture sûre du lien iCal', () => {
  it('URL : https, domaine public uniquement', () => {
    expect(isSafePublicHttpsUrl('https://www.airbnb.fr/calendar/ical/1.ics?s=x')).toBe(true)
    for (const url of ['http://airbnb.fr/x.ics', 'https://localhost/x', 'https://10.0.0.1/x', 'https://[::1]/x', 'https://u:p@airbnb.fr/x', 'https://intranet/x', 'https://db.internal/x']) {
      expect(isSafePublicHttpsUrl(url)).toBe(false)
    }
  })

  it('adresses résolues : refuse privé, boucle locale, lien local, IPv6 locales', () => {
    expect(isPublicIpAddress('52.0.0.1')).toBe(true)
    expect(isPublicIpAddress('2a00:1450:4007::1')).toBe(true)
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isPublicIpAddress(ip)).toBe(false)
    }
  })

  it('lit un calendrier public', async () => {
    const fetcher = jest.fn().mockResolvedValue(ok(ICS))
    await expect(fetchIcal('https://www.airbnb.fr/c.ics', fetcher, publicDns)).resolves.toBe(ICS)
    expect(fetcher).toHaveBeenCalledWith('https://www.airbnb.fr/c.ics', expect.objectContaining({ redirect: 'manual' }))
  })

  it('refuse un hôte qui résout vers une adresse privée', async () => {
    const fetcher = jest.fn()
    await expect(fetchIcal('https://evil.example.com/c.ics', fetcher, async () => ['169.254.169.254'])).resolves.toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('revérifie chaque redirection (et en limite le nombre)', async () => {
    const redirect = (location: string) => new Response(null, { status: 302, headers: { location } })
    const toPrivate = jest.fn().mockResolvedValueOnce(redirect('https://localhost/c.ics'))
    await expect(fetchIcal('https://www.airbnb.fr/c.ics', toPrivate, publicDns)).resolves.toBeNull()
    expect(toPrivate).toHaveBeenCalledTimes(1)

    const loop = jest.fn().mockImplementation(async () => redirect('https://www.airbnb.fr/again.ics'))
    await expect(fetchIcal('https://www.airbnb.fr/c.ics', loop, publicDns)).resolves.toBeNull()
    expect(loop).toHaveBeenCalledTimes(4)
  })

  it('refuse une réponse trop lourde, en erreur ou qui n’est pas un calendrier', async () => {
    await expect(fetchIcal('https://a.fr/c.ics', async () => ok(ICS, { 'content-length': String(2 * 1024 * 1024) }), publicDns)).resolves.toBeNull()
    await expect(fetchIcal('https://a.fr/c.ics', async () => ok(`${ICS}${'x'.repeat(1024 * 1024)}`), publicDns)).resolves.toBeNull()
    await expect(fetchIcal('https://a.fr/c.ics', async () => new Response('nope', { status: 404 }), publicDns)).resolves.toBeNull()
    await expect(fetchIcal('https://a.fr/c.ics', async () => ok('<html>login</html>'), publicDns)).resolves.toBeNull()
  })
})
