'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, MapPin, Search } from 'lucide-react'
import { AdminTrailCandidateActions } from './AdminTrailCandidateActions'

type Candidate = {
  id: string
  title: string
  description: string | null
  primary_source_type: string
  source_refs: Array<{ attribution: string }>
  difficulty: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  start_label: string | null
  start_latitude: number | null
  start_longitude: number | null
  data_quality_status: string
  geometry_status: string
  elevation_status: string
  duplicate_poi_ids: string[]
  review_status: string
  published_poi_id?: string | null
}

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
}

function candidateScore(c: Candidate): number {
  let score = 0
  if (c.geometry_status === 'valid') score += 4
  if (c.elevation_status === 'valid') score += 2
  if (c.data_quality_status === 'complete') score += 1
  return score
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}`
}

export function CandidatesTable({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (query.trim() === '') return candidates
    const needle = normalize(query.trim())
    return candidates.filter(c =>
      normalize(c.title).includes(needle) ||
      normalize(c.description).includes(needle) ||
      normalize(c.start_label).includes(needle) ||
      normalize(c.primary_source_type).includes(needle),
    )
  }, [candidates, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = candidateScore(b) - candidateScore(a)
      if (diff !== 0) return diff
      return (a.title || '').localeCompare(b.title || '', 'fr', { ignorePunctuation: true })
    })
  }, [filtered])

  return (
    <div className="flex flex-col">
      {/* Barre recherche + compteur */}
      <div className="flex flex-col gap-4 border-b border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filtrer par titre, description, source…"
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-[13px] text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
          />
        </div>
        <div className="shrink-0 text-[12px] font-semibold text-gray-500">
          {sorted.length} / {candidates.length} candidat{candidates.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className="w-12 px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">#</th>
              <th className="min-w-[280px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Randonnée</th>
              <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Dist.</th>
              <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Déniv.</th>
              <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Durée</th>
              <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Diff.</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Statuts &amp; Sources</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/80 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="bg-gray-50/30 py-12 text-center text-[13px] font-medium text-gray-400">
                  {candidates.length === 0
                    ? 'Aucun candidat randonnée. Vérifiez les sources et URLs fournies.'
                    : 'Aucun candidat ne correspond à votre recherche.'}
                </td>
              </tr>
            ) : (
              sorted.map((c, index) => <CandidateRow key={c.id} candidate={c} rowNumber={index + 1} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CandidateRow({ candidate: c, rowNumber }: { candidate: Candidate; rowNumber: number }) {
  const hasCoords = c.start_latitude !== null && c.start_longitude !== null
  const coordsLabel = hasCoords ? `${c.start_latitude!.toFixed(6)}, ${c.start_longitude!.toFixed(6)}` : null
  const departText = c.start_label ?? coordsLabel ?? null
  const attribution = c.source_refs.map(s => s.attribution).filter(Boolean).join(' · ')

  return (
    <tr className="group transition-colors duration-200 hover:bg-gray-50/50">
      <td className="px-5 py-3 text-center">
        <span className="text-[11px] font-semibold text-gray-400">{rowNumber}</span>
      </td>

      <td className="px-4 py-3">
        <div className="flex max-w-[350px] flex-col">
          <span className="truncate text-[13px] font-bold text-neutral-900" title={c.title}>{c.title}</span>
          <span
            className="mt-0.5 line-clamp-2 whitespace-normal text-[11px] leading-relaxed text-gray-500"
            title={c.description ?? ''}
          >
            {c.description ?? <span className="italic opacity-60">Sans description.</span>}
          </span>
          {departText && (
            <span className="mt-1 flex items-center gap-1 text-[10px] font-mono text-gray-400">
              <MapPin size={10} />
              Départ : {departText}
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-3 text-right">
        <span className="text-[12px] font-bold text-neutral-700">
          {c.distance_km != null ? `${c.distance_km.toFixed(1)} km` : '—'}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="text-[12px] font-bold text-neutral-700">
          {c.elevation_gain_m != null ? `${Math.round(c.elevation_gain_m)} m` : '—'}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="text-[12px] font-bold text-neutral-700">{formatDuration(c.estimated_duration_min)}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-[11px] font-semibold capitalize text-gray-500">{c.difficulty ?? '—'}</span>
      </td>

      <td className="px-4 py-3">
        <div className="flex max-w-[280px] flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge value={c.geometry_status} label="Géom." />
            <StatusBadge value={c.elevation_status} label="Élév." />
            <StatusBadge value={c.review_status} label="Revue" />
          </div>
          <div className="mt-0.5 flex flex-col whitespace-normal">
            <span className="text-[10px] text-gray-500">
              <span className="font-semibold">Source :</span> {c.primary_source_type}
            </span>
            {attribution && (
              <span className="line-clamp-1 text-[9px] leading-tight text-gray-400" title={attribution}>
                <span className="font-semibold">Attr :</span> {attribution}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-3 align-top">
        <div className="flex flex-col items-end gap-2">
          {c.duplicate_poi_ids.length > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Doublons : {c.duplicate_poi_ids.length}
            </span>
          )}
          <AdminTrailCandidateActions
            candidateId={c.id}
            reviewStatus={c.review_status}
            duplicatePoiIds={c.duplicate_poi_ids}
            geometryStatus={c.geometry_status}
            editable={{
              title: c.title,
              description: c.description,
              difficulty: c.difficulty,
              start_label: c.start_label,
              distance_km: c.distance_km,
              elevation_gain_m: c.elevation_gain_m,
              estimated_duration_min: c.estimated_duration_min,
            }}
          />
          {c.published_poi_id && (
            <Link
              href={`/admin/pois/${c.published_poi_id}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#0B1437] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Gérer la fiche
            </Link>
          )}
        </div>
      </td>
    </tr>
  )
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  let colorClass = 'border-gray-200 bg-gray-50 text-gray-500'
  const s = value?.toLowerCase()
  if (s === 'valid' || s === 'published' || s === 'complete')
    colorClass = 'border-emerald-200/60 bg-emerald-50 text-emerald-600'
  else if (s === 'invalid' || s === 'missing' || s === 'failed' || s === 'rejected')
    colorClass = 'border-rose-200/60 bg-rose-50 text-rose-600'
  else if (s === 'needs_review')
    colorClass = 'border-amber-200/60 bg-amber-50 text-amber-600'
  else if (s === 'merged')
    colorClass = 'border-[#0B1437]/20 bg-[#F4F7FE] text-[#0B1437]'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colorClass}`}>
      <span className="opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  )
}
