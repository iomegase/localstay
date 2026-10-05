/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.0.0.2'],
  // Spec 059 : le service worker doit toujours être revalidé.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Spec 042 AC-09-04 : déployer avant le script de renommage des données.
      { source: '/journal/article-f7e6dcbc', destination: '/journal/restaurants-altitude-saint-nicolas-de-veroce', permanent: true },
      { source: '/blog/article-f7e6dcbc', destination: '/journal/restaurants-altitude-saint-nicolas-de-veroce', permanent: true },
      { source: '/logements/appart-luxe-vue-mont-blanc-6-p', destination: '/logements/appartement-vue-mont-blanc-6-p', permanent: true },
      { source: '/blog/:path*', destination: '/journal/:path*', permanent: true },
      // Slug renommé par le Product Owner le 2026-10-01 (audit home) : l'ancienne URL reste valide en 301.
      {
        source: '/logements/t2-cosy-le-mont-joly-saint-gervais-les-bains',
        destination: '/logements/les-hauts-de-saint-gervais',
        permanent: true,
      },
    ]
  },
  images: {
    // Spec 042 AC-10-01 : DNS64 local rejeté par l'optimiseur Next 16.2.6.
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      {
        protocol: 'https',
        hostname: 'cftqqyqfhlvobtsatxdq.supabase.co',
      },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.camptocamp.org' },
      { protocol: 'https', hostname: 'cdn.iris-etourism.io' },
      { protocol: 'https', hostname: 'geotrek.nature-haute-savoie.fr' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: 'lerelaisdescommunailles.com' },
      { protocol: 'https', hostname: 'static.apidae-tourisme.com' },
      { protocol: 'https', hostname: 'static.wixstatic.com' },
      { protocol: 'https', hostname: 'www.3serac.fr' },
      { protocol: 'https', hostname: 'www.tramwaydumontblanc.fr' },
      { protocol: 'https', hostname: 'woody.cloudly.space' },
      { protocol: 'https', hostname: 'www.thermes-saint-gervais.com' },
      { protocol: 'https', hostname: 'api.cloudly.space' },
      { protocol: 'https', hostname: 'www.saintgervais.com' },
    ],
  },
}

export default nextConfig
