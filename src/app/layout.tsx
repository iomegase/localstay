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
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
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
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap"
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
