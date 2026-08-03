import type { MetadataRoute } from 'next'
import { SITE } from '@/features/seo/lib/site'

// Manifest PWA : permet à Android de s'ouvrir sans barres de navigation via
// « Ajouter à l'écran d'accueil » (parité avec la config appleWebApp iOS).
export default function manifest(): MetadataRoute.Manifest {
  const appIcon = '/mystay-logo-approved/mystay-app-icon-approved.png'

  return {
    name: SITE.defaultTitle,
    short_name: SITE.name,
    description: SITE.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F6',
    theme_color: '#FAF9F6',
    icons: [
      { src: appIcon, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: appIcon, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
