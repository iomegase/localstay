import type { Metadata, Viewport } from 'next'
import {
  Lobster,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Quicksand,
  Story_Script,
} from 'next/font/google'
import { MobileBrowserChromeCollapser } from '@/shared/components/MobileBrowserChromeCollapser'
import { SITE, siteBaseUrl } from '@/features/seo/lib/site'
import { JsonLd } from '@/shared/components/JsonLd'
import { organizationSchema, websiteSchema } from '@/features/seo/lib/structured-data'
import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

const lobster = Lobster({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-lobster',
  display: 'swap',
})

const storyScript = Story_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-story',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl()),
  title: { default: SITE.defaultTitle, template: '%s | MyStay' },
  description: SITE.defaultDescription,
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: '/mystay-logo-approved/favicon.ico' },
      {
        url: '/mystay-logo-approved/favicon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/mystay-logo-approved/favicon-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/mystay-logo-approved/favicon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
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
    <html
      lang="fr"
      className={`${jakartaSans.variable} ${playfairDisplay.variable} ${quicksand.variable} ${lobster.variable} ${storyScript.variable}`}
    >
      <body
        className="bg-white text-charcoal font-sans antialiased"
        suppressHydrationWarning
      >
        <MobileBrowserChromeCollapser />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
      </body>
    </html>
  )
}
