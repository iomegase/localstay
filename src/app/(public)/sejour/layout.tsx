import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

export const metadata: Metadata = privatePageMetadata('Votre séjour — MyStay')

export default function SejourLayout({ children }: { children: React.ReactNode }) {
  return children
}
