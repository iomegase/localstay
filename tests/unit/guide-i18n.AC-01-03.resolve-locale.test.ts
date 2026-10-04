import { GUIDE_LOCALES, LOCALE_COOKIE, isGuideLocale, resolveGuideLocale } from '@/features/guide-i18n/lib/locale'

describe('061 AC-01-03 / AC-01-04 — langue du guide', () => {
  it('supporte fr et en, cookie de la spec 027', () => {
    expect(GUIDE_LOCALES).toEqual(['fr', 'en'])
    expect(LOCALE_COOKIE).toBe('staylocal_locale')
    expect(isGuideLocale('en')).toBe(true)
    expect(isGuideLocale('it')).toBe(false)
  })

  it('le cookie valide l’emporte', () => {
    expect(resolveGuideLocale({ cookie: 'en', acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en')
    expect(resolveGuideLocale({ cookie: 'fr', acceptLanguage: 'en-GB' })).toBe('fr')
  })

  it('sans cookie : langue préférée du téléphone', () => {
    expect(resolveGuideLocale({ cookie: undefined, acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8' })).toBe('fr')
    expect(resolveGuideLocale({ cookie: undefined, acceptLanguage: 'en-GB,en;q=0.9,fr;q=0.8' })).toBe('en')
    expect(resolveGuideLocale({ cookie: undefined, acceptLanguage: 'de-DE,de;q=0.9' })).toBe('en')
    expect(resolveGuideLocale({ cookie: 'it', acceptLanguage: 'nl-NL' })).toBe('en')
  })

  it('sans en-tête : français (langue source)', () => {
    expect(resolveGuideLocale({ cookie: undefined, acceptLanguage: null })).toBe('fr')
    expect(resolveGuideLocale({ cookie: undefined, acceptLanguage: '' })).toBe('fr')
  })
})
