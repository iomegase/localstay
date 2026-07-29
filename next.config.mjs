/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      {
        protocol: 'https',
        hostname: 'cftqqyqfhlvobtsatxdq.supabase.co',
      },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: 'lerelaisdescommunailles.com' },
      { protocol: 'https', hostname: 'static.apidae-tourisme.com' },
      { protocol: 'https', hostname: 'static.wixstatic.com' },
      { protocol: 'https', hostname: 'www.3serac.fr' },
      { protocol: 'https', hostname: 'www.tramwaydumontblanc.fr' },
      { protocol: 'https', hostname: 'woody.cloudly.space' },
      { protocol: 'https', hostname: 'www.thermes-saint-gervais.com' },
    ],
  },
}

export default nextConfig
