import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

export const metadata: Metadata = privatePageMetadata('Services privés')

export default async function ServicesPrivesPage() {
  redirect('/nos-recommandations')
}
