import {
  createPinnedLookup,
  downloadImageSafely,
  type DownloadDeps,
} from '@/features/poi-photos/services/safe-image-download'
import { isMyStayStorageUrl, isThirdPartyPhotoUrl } from '@/features/poi-photos/lib/storage-url'

const SUPABASE = 'https://abcdefgh.supabase.co'
beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE })

function imageResponse(body: Uint8Array, headers: Record<string, string> = {}) {
  return new Response(body, { status: 200, headers: { 'content-type': 'image/jpeg', ...headers } })
}
function deps(over: Partial<DownloadDeps> = {}): DownloadDeps {
  return {
    fetch: jest.fn(async () => imageResponse(new Uint8Array([1, 2, 3]))) as unknown as typeof fetch,
    lookup: jest.fn(async () => ['93.184.216.34']),
    ...over,
  }
}

describe('063 — URL MyStay', () => {
  it('reconnaît une copie publique du stockage du projet', () => {
    expect(isMyStayStorageUrl(`${SUPABASE}/storage/v1/object/public/guide-photos/pois/p/a.webp`)).toBe(true)
    expect(isMyStayStorageUrl('https://autre.supabase.co/storage/v1/object/public/x.webp')).toBe(false)
    expect(isMyStayStorageUrl('/fallback/restaurant.webp')).toBe(false)
  })

  it('ne considère comme tierces que les URL http(s) absolues hors MyStay', () => {
    expect(isThirdPartyPhotoUrl('https://www.restaurant-leroyal.com/a.jpg')).toBe(true)
    expect(isThirdPartyPhotoUrl(`${SUPABASE}/storage/v1/object/public/guide-photos/a.webp`)).toBe(false)
    expect(isThirdPartyPhotoUrl('/fallback/restaurant.webp')).toBe(false)
    expect(isThirdPartyPhotoUrl('')).toBe(false)
  })
})

describe('063 — téléchargement sécurisé', () => {
  it('AC-02-01: refuse une URL non https sans requête réseau', async () => {
    const d = deps()
    await expect(downloadImageSafely('http://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'NOT_HTTPS' })
    expect(d.fetch).not.toHaveBeenCalled()
  })

  it.each(['https://localhost/a.jpg', 'https://127.0.0.1/a.jpg', 'https://10.0.0.5/a.jpg', 'https://169.254.169.254/a.jpg', 'https://[::1]/a.jpg'])(
    'AC-02-02: refuse l’hôte interne %s sans requête réseau',
    async url => {
      const d = deps()
      await expect(downloadImageSafely(url, d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
      expect(d.fetch).not.toHaveBeenCalled()
    },
  )

  it('AC-02-02: refuse un nom de domaine qui résout vers une adresse privée', async () => {
    const d = deps({ lookup: jest.fn(async () => ['192.168.1.10']) })
    await expect(downloadImageSafely('https://piege.example/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
    expect(d.fetch).not.toHaveBeenCalled()
  })

  it('AC-02-02: revalide chaque redirection et refuse une cible interne', async () => {
    const fetchMock = jest.fn(async () => new Response(null, { status: 302, headers: { location: 'https://169.254.169.254/latest' } }))
    const d = deps({ fetch: fetchMock as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('suit une redirection https publique', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: 'https://cdn.site.fr/a.jpg' } }))
      .mockResolvedValueOnce(imageResponse(new Uint8Array([9])))
    const result = await downloadImageSafely('https://site.fr/a.jpg', deps({ fetch: fetchMock as unknown as typeof fetch }))
    expect(result).toMatchObject({ ok: true, contentType: 'image/jpeg' })
  })

  it('AC-02-03: refuse un contenu qui n’est pas une image', async () => {
    const d = deps({ fetch: jest.fn(async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'NOT_IMAGE' })
  })

  it('AC-02-03: refuse un content-length supérieur à 8 Mo', async () => {
    const d = deps({ fetch: jest.fn(async () => imageResponse(new Uint8Array([1]), { 'content-length': String(9 * 1024 * 1024) })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'TOO_LARGE' })
  })

  it('AC-02-03: coupe un flux qui dépasse 8 Mo malgré un content-length mensonger', async () => {
    const big = new Uint8Array(9 * 1024 * 1024)
    const d = deps({ fetch: jest.fn(async () => imageResponse(big, { 'content-length': '10' })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'TOO_LARGE' })
  })

  it('AC-02-03: renvoie TIMEOUT quand la requête est interrompue', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const d = deps({ fetch: jest.fn(async () => { throw abortError }) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'TIMEOUT' })
  })

  // Revue finale (point 1) : formes IPv6 qui encodent une adresse IPv4 interne,
  // et plages réservées manquantes.
  it.each([
    'https://[::ffff:a9fe:a9fe]/latest',
    'https://[::7f00:1]/',
    'https://[fe90::1]/',
    'https://[64:ff9b::a9fe:a9fe]/',
    'https://[2002:a9fe:a9fe::1]/',
    'https://[ff02::1]/',
    'https://198.18.0.1/',
    'https://192.0.0.8/',
  ])('AC-02-02: refuse une redirection vers %s', async target => {
    const fetchMock = jest.fn(async () => new Response(null, { status: 302, headers: { location: target } }))
    const d = deps({ fetch: fetchMock as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.jpg', d)).resolves.toEqual({ ok: false, reason: 'PRIVATE_HOST' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  // Revue finale (point 3) : seuls les formats matriciels attendus sont acceptés.
  it.each(['image/svg+xml', 'image/x-icon', 'image/tiff'])('AC-02-03: refuse le type %s', async type => {
    const d = deps({ fetch: jest.fn(async () => imageResponse(new Uint8Array([1]), { 'content-type': type })) as unknown as typeof fetch })
    await expect(downloadImageSafely('https://site.fr/a.svg', d)).resolves.toEqual({ ok: false, reason: 'NOT_IMAGE' })
  })
})

// Revue finale (point 1, rebond DNS) : la résolution utilisée pour la connexion est
// elle-même filtrée, si bien qu'une seconde résolution vers une adresse interne échoue.
describe('063 — résolution épinglée à la connexion', () => {
  it('refuse une résolution privée au moment de la connexion', done => {
    const lookup = createPinnedLookup(async () => [{ address: '10.0.0.7', family: 4 }])
    lookup('piege.example', {}, (error, address) => {
      expect(error).toMatchObject({ code: 'PRIVATE_HOST' })
      expect(address).toBeUndefined()
      done()
    })
  })

  it('transmet une résolution publique', done => {
    const lookup = createPinnedLookup(async () => [{ address: '93.184.216.34', family: 4 }])
    lookup('site.example', {}, (error, address, family) => {
      expect(error).toBeNull()
      expect(address).toBe('93.184.216.34')
      expect(family).toBe(4)
      done()
    })
  })

  it('renvoie la liste des adresses quand Node demande { all: true } (autoSelectFamily)', done => {
    const lookup = createPinnedLookup(async () => [{ address: '93.184.216.34', family: 4 }])
    lookup('site.example', { all: true }, (error, addresses) => {
      expect(error).toBeNull()
      expect(addresses).toEqual([{ address: '93.184.216.34', family: 4 }])
      done()
    })
  })
})
