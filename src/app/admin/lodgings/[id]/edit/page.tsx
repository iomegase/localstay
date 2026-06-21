import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'
import { getAdminLodgingShowcasePageData } from '@/features/lodging-showcase/queries/owner-public-profile'

interface Props { params: Promise<{ id: string }> }

export default async function AdminLodgingEditPage({ params }: Props) {
  await getPageAdmin()
  const { id } = await params
  const data = await getAdminLodgingShowcasePageData(id)
  if (!data) { notFound(); return null }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Link href="/admin/lodgings" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-charcoal">
        <ArrowLeft className="h-4 w-4" />
        Retour à la modération
      </Link>
      <header className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">Super-admin · Édition</p>
        <h1 className="mt-2 text-3xl font-light text-charcoal">{data.lodging.name}</h1>
        <p className="mt-2 text-sm text-gray-500">{data.lodging.city.name} — édition de la fiche publique. Les modifications enregistrées restent dans le statut de publication actuel.</p>
      </header>
      <LodgingShowcaseForm lodgingId={data.lodging.id} initialProfile={data.profile} mode="admin" />
    </div>
  )
}
