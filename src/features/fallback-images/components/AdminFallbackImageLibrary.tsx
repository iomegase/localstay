'use client'

import { useState, useTransition, type ChangeEvent, type DragEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { FallbackImageDto, FallbackImageListFilter } from '../queries/library'

type CategoryOption = {
  id: string
  name: string
  subcategories: Array<{ id: string; name: string }>
}

const REJECTION_LABELS: Record<string, string> = {
  INVALID_TYPE: 'format non supporté',
  TOO_LARGE: 'fichier trop lourd (5 Mo max)',
  UPLOAD_FAILED: 'envoi impossible',
}

const selectClass = 'h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-neutral-900 focus:border-[#0B1437] focus:outline-none'

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

function classificationLabel(image: FallbackImageDto): string {
  if (!image.category) return 'Non classée'
  return image.subcategory ? `${image.category.name} › ${image.subcategory.name}` : image.category.name
}

/** Spec 070 US-01 : envoi en masse, filtres, classement groupé et retrait des images de remplacement. */
export function AdminFallbackImageLibrary({
  images,
  categories,
  filter,
}: {
  images: FallbackImageDto[]
  categories: CategoryOption[]
  filter: FallbackImageListFilter
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const subcategories = categories.find(category => category.id === categoryId)?.subcategories ?? []

  function toggle(id: string) {
    setSelected(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  function upload(files: File[]) {
    if (files.length === 0) return
    setStatus(null)
    setError(null)
    startTransition(async () => {
      const body = new FormData()
      files.forEach(file => body.append('files', file))
      const response = await fetch('/api/admin/fallback-images', { method: 'POST', body })
      const json = await response.json().catch(() => null) as {
        data?: { created: unknown[]; rejected: Array<{ name: string; code: string }> }
        error?: { message?: string }
      } | null
      if (!response.ok || !json?.data) {
        setError(json?.error?.message ?? 'Envoi impossible')
        return
      }
      if (json.data.created.length > 0) {
        setStatus(`${plural(json.data.created.length, 'image ajoutée', 'images ajoutées')} dans « Non classées »`)
      }
      if (json.data.rejected.length > 0) {
        setError(json.data.rejected.map(item => `${item.name} : ${REJECTION_LABELS[item.code] ?? 'refusé'}`).join(' · '))
      }
      router.refresh()
    })
  }

  function classify() {
    setStatus(null)
    setError(null)
    startTransition(async () => {
      const response = await fetch('/api/admin/fallback-images/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_ids: selected,
          category_id: categoryId || null,
          subcategory_id: subcategoryId || null,
        }),
      })
      const json = await response.json().catch(() => null) as { data?: { updated: number }; error?: { message?: string } } | null
      if (!response.ok || !json?.data) {
        setError(json?.error?.message ?? 'Classement impossible')
        return
      }
      setStatus(`${plural(json.data.updated, 'image classée', 'images classées')}`)
      setSelected([])
      router.refresh()
    })
  }

  function remove(image: FallbackImageDto) {
    const usage = image.usage_count > 0 ? ` Elle est utilisée par ${plural(image.usage_count, 'lieu', 'lieux')}, qui recevront une autre image.` : ''
    if (!window.confirm(`Retirer cette image ?${usage}`)) return
    startTransition(async () => {
      const response = await fetch(`/api/admin/fallback-images/${image.id}`, { method: 'DELETE' })
      if (!response.ok) {
        setError('Retrait impossible')
        return
      }
      router.refresh()
    })
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    upload(Array.from(event.dataTransfer.files))
  }

  const filterLinks = [
    { label: 'Toutes', href: '/admin/fallback-images', active: !filter.filter && !filter.category_id },
    { label: 'Non classées', href: '/admin/fallback-images?filter=unclassified', active: filter.filter === 'unclassified' },
    ...categories.map(category => ({
      label: category.name,
      href: `/admin/fallback-images?category_id=${category.id}`,
      active: filter.category_id === category.id,
    })),
  ]

  return (
    <div className="space-y-6">
      <label
        onDragOver={event => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[25px] border-2 border-dashed p-10 text-center transition-colors ${dragging ? 'border-[#0B1437] bg-[#F4F7FE]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
      >
        <ImagePlus aria-hidden="true" className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-bold text-neutral-900">{isPending ? 'Traitement…' : 'Glissez vos images ici ou cliquez pour les choisir'}</span>
        <span className="text-xs text-gray-500">PNG, JPEG, WebP ou AVIF · 5 Mo max · 30 par envoi · converties en WebP</span>
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif"
          aria-label="Ajouter des images"
          className="sr-only"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            upload(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
      </label>

      {status && <p role="status" className="text-sm font-semibold text-emerald-700">{status}</p>}
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}

      <nav aria-label="Filtrer les images" className="flex gap-2 overflow-x-auto pb-1">
        {filterLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.active ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-bold ${link.active ? 'border-[#0B1437] bg-[#0B1437] text-white' : 'border-gray-100 bg-white text-neutral-700 hover:bg-gray-50'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {selected.length > 0 && (
        <section
          aria-label="Classer la sélection"
          className="sticky top-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
        >
          <span className="text-sm font-bold text-neutral-900">{plural(selected.length, 'image sélectionnée', 'images sélectionnées')}</span>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            Catégorie
            <select
              value={categoryId}
              onChange={event => { setCategoryId(event.target.value); setSubcategoryId('') }}
              className={selectClass}
            >
              <option value="">Non classée</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            Sous-catégorie
            <select
              value={subcategoryId}
              onChange={event => setSubcategoryId(event.target.value)}
              disabled={!categoryId}
              className={selectClass}
            >
              <option value="">Toute la catégorie</option>
              {subcategories.map(subcategory => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
            </select>
          </label>
          <Button type="button" onClick={classify} disabled={isPending} className="h-10 rounded-xl bg-[#0B1437] px-5 text-[13px] font-bold text-white">
            Classer
          </Button>
          <button type="button" onClick={() => setSelected([])} className="text-xs font-semibold text-gray-500 hover:text-neutral-900">
            Annuler
          </button>
        </section>
      )}

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">Aucune image ici.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map(image => {
            const isSelected = selected.includes(image.id)
            return (
              <li
                key={image.id}
                aria-label={`Image ${image.id}`}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isSelected ? 'border-[#0B1437] ring-2 ring-[#0B1437]' : 'border-gray-100'}`}
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- vignette admin, fichier déjà en WebP */}
                  <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(image.id)}
                    aria-label={`Sélectionner l’image ${image.id}`}
                    className="absolute left-3 top-3 h-5 w-5 cursor-pointer accent-[#0B1437]"
                  />
                </div>
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-neutral-900">{classificationLabel(image)}</p>
                    <p className="text-[11px] text-gray-500">{plural(image.usage_count, 'lieu', 'lieux')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(image)}
                    aria-label="Retirer"
                    title="Retirer"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
