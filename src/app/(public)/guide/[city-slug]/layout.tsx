import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

export const metadata: Metadata = privatePageMetadata('Guide privé — MyStay')

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children
}
