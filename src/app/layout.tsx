import type { Metadata, Viewport } from 'next'
import { MobileBrowserChromeCollapser } from '@/shared/components/MobileBrowserChromeCollapser'
import { SITE, siteBaseUrl } from '@/features/seo/lib/site'
import { JsonLd } from '@/shared/components/JsonLd'
import { organizationSchema, websiteSchema } from '@/features/seo/lib/structured-data'
import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl()),
  title: { default: SITE.defaultTitle, template: '%s | StayLocal' },
  description: SITE.defaultDescription,
  applicationName: SITE.name,
  // Pas de canonical global ici : il serait hérité par toutes les pages sans metadata propre
  // (/contact, /le-logement…) qui se déclareraient alors doublons de la home. Chaque page
  // pose son propre canonical (la home le fait dans (public)/page.tsx).
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    url: '/',
    images: [{ url: '/imageOpenGraph.png', width: 1200, height: 630, alt: SITE.defaultTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    images: ['/imageOpenGraph.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE.name,
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FAF9F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Quicksand:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet"/>
      </head>
      <body
        className="bg-ivory text-charcoal font-sans antialiased"
        suppressHydrationWarning
      >
        <MobileBrowserChromeCollapser />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
      </body>
    </html>
  )
}
