'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LodgingDialog } from './LodgingDialog'
import type { LodgingItem } from '../queries/lodgings'
import {
  Plus,
  Pencil,
  QrCode,
  SlidersHorizontal,
  Home,
  MapPin,
  AlertCircle,
  Power,
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

const STATUS_STYLES: Record<string, string> = {
  generated: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50',
  missing: 'bg-amber-50/80 text-amber-600 border-amber-100/50',
}

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
      {/* Header card */}
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Mes logements
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Gestion des séjours
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Centralisez vos hébergements, suivez les scans QR et personnalisez le guide proposé à vos voyageurs.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md"
        >
          <Plus size={16} className="transition-transform duration-300 group-hover:scale-110" />
          Ajouter un logement
        </button>
      </header>

      {/* KPIs */}
      <div className="grid gap-6 sm:grid-cols-3">
        <MetricCard title="Logements" value={lodgings.length} icon={Home} />
        <MetricCard title="QR générés" value={generatedCount} icon={QrCode} />
        <MetricCard title="Scans cumulés" value={totalScans} icon={MapPin} />
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-base font-bold text-neutral-900">Liste des logements</h2>
        </div>

        {lodgings.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-gray-50/30 p-12 text-center">
            <p className="text-sm font-medium text-gray-500">Aucun logement</p>
            <p className="mt-1 text-xs text-gray-400">
              Ajoutez votre premier logement pour générer un QR code et personnaliser un guide.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left">
              <thead className="border-b border-gray-100 bg-white">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Logement
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    QR code
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Scans
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80 bg-white">
                {lodgings.map(lodging => {
                  const qrLabel = lodging.qr_code_status === 'generated' ? 'Généré' : 'Manquant'
                  const qrStyle = STATUS_STYLES[lodging.qr_code_status]

                  return (
                    <tr
                      key={lodging.id}
                      className="group transition-colors duration-200 hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-neutral-900">
                            {lodging.name}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                            <MapPin size={12} className="text-[#0B1437]/40" />
                            <span>{lodging.city_name}</span>
                          </div>
                          {!lodging.is_active && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-rose-500">
                              <AlertCircle size={12} className="shrink-0" />
                              Logement désactivé
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${qrStyle}`}
                        >
                          <QrCode size={10} />
                          {qrLabel}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-[13px] font-bold text-neutral-900">
                          {lodging.qr_scan_count.toLocaleString('fr-FR')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            lodging.is_active
                              ? 'border-emerald-100/50 bg-emerald-50/80 text-emerald-600'
                              : 'border-gray-200/50 bg-gray-100/80 text-gray-500'
                          }`}
                        >
                          {lodging.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/lodgings/${lodging.id}/customize`)
                            }
                            className="inline-flex h-[32px] items-center justify-center gap-1.5 rounded-lg bg-[#F4F7FE] px-3 text-[11px] font-bold text-[#0B1437] transition-all duration-300 hover:bg-[#0B1437] hover:text-white"
                          >
                            <SlidersHorizontal size={12} />
                            Personnaliser
                          </button>

                          <button
                            onClick={() => openEdit(lodging)}
                            className="inline-flex h-[32px] items-center justify-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 text-[11px] font-bold text-gray-600 transition-all duration-300 hover:border-gray-200 hover:text-[#0B1437]"
                          >
                            <Pencil size={12} />
                            Modifier
                          </button>

                          <button
                            onClick={() => handleDeactivate(lodging.id)}
                            disabled={!lodging.is_active}
                            className="inline-flex h-[32px] items-center justify-center gap-1.5 rounded-lg border border-rose-100/60 bg-rose-50/40 px-3 text-[11px] font-bold text-rose-500 transition-all duration-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Power size={12} />
                            Désactiver
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LodgingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lodging={editTarget}
        cities={cities}
      />
    </div>
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
    <div className="group flex items-center gap-5 rounded-[20px] border border-gray-50 bg-white p-6 shadow-sm transition-all hover:border-gray-100 hover:shadow-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F3F4F8] text-[#0B1437] transition-transform duration-300 group-hover:scale-110">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </h3>
        <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
          {value.toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  )
}
