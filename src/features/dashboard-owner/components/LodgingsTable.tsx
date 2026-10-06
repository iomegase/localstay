'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LodgingDialog } from './LodgingDialog'
import type { LodgingItem } from '../queries/lodgings'
import {
  BookOpen,
  Home,
  MapPin,
  Pencil,
  Plus,
  Power,
  QrCode,
  ScanLine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface City {
  id: string
  name: string
}

interface Props {
  lodgings: LodgingItem[]
  cities: City[]
}

const PRIMARY_ACTION = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#F4F7FE] px-3.5 text-[12px] font-bold text-[#0B1437] transition-colors hover:bg-[#0B1437] hover:text-white'
const ICON_ACTION = 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition-colors hover:border-gray-200 hover:text-[#0B1437] disabled:cursor-not-allowed disabled:opacity-40'

// Spec 077 US-01 : un logement = une carte ; « Guide » et « Logement » remplacent « Personnaliser » et « Vitrine ».
export function LodgingsTable({ lodgings, cities }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LodgingItem | undefined>()

  function openCreate() {
    setEditTarget(undefined)
    setDialogOpen(true)
  }

  function openEdit(lodging: LodgingItem) {
    setEditTarget(lodging)
    setDialogOpen(true)
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/dashboard/lodgings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    router.refresh()
  }

  const totalScans = lodgings.reduce((sum, l) => sum + l.qr_scan_count, 0)
  const generatedCount = lodgings.filter(l => l.qr_code_status === 'generated').length

  return (
    <div className="w-full animate-in fade-in space-y-6 duration-500">
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Mes logements
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Gestion des séjours
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Pour chaque logement : le guide de vos voyageurs, sa page publique et son QR code.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md"
        >
          <Plus size={16} aria-hidden="true" />
          Ajouter un logement
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Logements" value={lodgings.length} icon={Home} />
        <MetricCard title="QR générés" value={generatedCount} icon={QrCode} />
        <MetricCard title="Scans cumulés" value={totalScans} icon={ScanLine} />
      </div>

      {lodgings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[25px] border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-gray-500">Aucun logement</p>
          <p className="mt-1 text-xs text-gray-400">
            Ajoutez votre premier logement pour créer son guide et son QR code.
          </p>
        </div>
      ) : (
        <ul aria-label="Mes logements" className="space-y-3">
          {lodgings.map(lodging => (
            <li
              key={lodging.id}
              aria-label={lodging.name}
              className={`flex flex-col gap-4 rounded-[20px] border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center ${lodging.is_active ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-80'}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {lodging.cover_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lodging.cover_photo_url} alt="" referrerPolicy="no-referrer" className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FE] text-[#0B1437]/40 sm:h-20 sm:w-20">
                    <Home size={24} aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-neutral-900">{lodging.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <MapPin size={12} aria-hidden="true" /> {lodging.city_name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={lodging.is_active ? 'green' : 'gray'}>{lodging.is_active ? 'Actif' : 'Désactivé'}</Badge>
                    <Badge tone={lodging.qr_code_status === 'generated' ? 'green' : 'amber'}>
                      {lodging.qr_code_status === 'generated' ? 'QR généré' : 'QR manquant'}
                    </Badge>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {lodging.qr_scan_count.toLocaleString('fr-FR')} {lodging.qr_scan_count > 1 ? 'scans' : 'scan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/lodgings/${lodging.id}/customize`} className={PRIMARY_ACTION}>
                  <BookOpen size={14} aria-hidden="true" /> Guide
                </Link>
                <Link href={`/dashboard/lodgings/${lodging.id}/showcase`} className={PRIMARY_ACTION}>
                  <Home size={14} aria-hidden="true" /> Logement
                </Link>
                <Link href={`/dashboard/lodgings/${lodging.id}/qr-code`} className={PRIMARY_ACTION}>
                  <QrCode size={14} aria-hidden="true" /> QR code
                </Link>
                <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />
                <button type="button" onClick={() => openEdit(lodging)} className={ICON_ACTION} aria-label={`Modifier ${lodging.name}`} title="Modifier">
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeactivate(lodging.id)}
                  disabled={!lodging.is_active}
                  className={`${ICON_ACTION} hover:border-rose-200 hover:text-rose-600`}
                  aria-label={`Désactiver ${lodging.name}`}
                  title="Désactiver"
                >
                  <Power size={15} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LodgingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lodging={editTarget}
        cities={cities}
      />
    </div>
  )
}

function Badge({ tone, children }: { tone: 'green' | 'amber' | 'gray'; children: React.ReactNode }) {
  const styles = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    gray: 'border-gray-200 bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[tone]}`}>
      {children}
    </span>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number
  icon: LucideIcon
}) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-gray-50 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F8] text-[#0B1437]">
        <Icon size={22} strokeWidth={2} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </h3>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
          {value.toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  )
}
