import { renderToString } from 'react-dom/server'
import { GuidePwaRuntime } from '@/features/guide-pwa/components/GuidePwaRuntime'

describe('guide-pwa AC-03-03 — pas de flash du séjour dans l’app installée', () => {
  it('le HTML serveur masque le séjour en mode installé jusqu’à la vérification', () => {
    const html = renderToString(
      <GuidePwaRuntime lodgingId="11111111-1111-4111-8111-111111111111"><p>Wi-Fi : neige-2026</p></GuidePwaRuntime>,
    )
    expect(html).toContain('data-pwa-gate="pending"')
    expect(html).toContain('class="[@media(display-mode:standalone)]:invisible"')
    expect(html).toContain('Wi-Fi : neige-2026')
  })
})
