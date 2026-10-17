import { isSocialProfileUrl } from '@/shared/lib/social-profile'
import { fetchOfficialWebsitePhotoEnrichmentDetailed } from '@/features/poi-acquisition/services/official-website-photos'

// Spec 098 BR-08 — un profil de réseau social n'est pas un site officiel.
describe('098 BR-08 — isSocialProfileUrl', () => {
  it('reconnaît les réseaux sociaux, sous-domaines compris', () => {
    for (const url of [
      'https://www.instagram.com/les_rhodos74?igsh=MTJr&utm_source=qr',
      'https://m.facebook.com/brasserie',
      'https://fb.me/abc',
      'https://www.tiktok.com/@resto',
      'https://x.com/resto',
      'https://linktr.ee/resto',
    ]) expect(isSocialProfileUrl(url)).toBe(true)
  })

  it('un vrai site, une URL invalide ou vide ne sont pas des réseaux sociaux', () => {
    for (const url of ['https://aubergedelagorge.com/', 'https://instagram-food.fr/', 'pas une url', '', null]) {
      expect(isSocialProfileUrl(url)).toBe(false)
    }
  })

  it('aucune photo « du site officiel » tirée d’Instagram', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    await expect(fetchOfficialWebsitePhotoEnrichmentDetailed('https://www.instagram.com/les_rhodos74')).resolves.toEqual({ status: 'no_website' })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
