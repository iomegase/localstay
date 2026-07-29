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
    ],
  },
}

export default nextConfig
