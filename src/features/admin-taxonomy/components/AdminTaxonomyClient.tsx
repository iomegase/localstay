"use client"

import { useState, useTransition } from 'react'
import { Plus, Power, Edit2, AlertCircle } from 'lucide-react'
import type { AdminCategory, AdminSubCategory } from '../types'
import { getLucideIconComponent, LUCIDE_ICON_COMPONENTS } from '../lib/icons'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'

type DialogState =
  | { kind: 'category-create' }
  | { kind: 'category-edit'; category: AdminCategory }
  | { kind: 'subcategory-create'; category: AdminCategory }
  | { kind: 'subcategory-edit'; subcategory: AdminSubCategory }
  | null

type DisableState =
  | { kind: 'category'; category: AdminCategory }
  | { kind: 'subcategory'; subcategory: AdminSubCategory }
  | null

export function AdminTaxonomyClient({ initialCategories }: { initialCategories: AdminCategory[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [disableDialog, setDisableDialog] = useState<DisableState>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function refreshTaxonomy() {
    const res = await fetch('/api/admin/taxonomy')
    if (!res.ok) throw new Error('TAXONOMY_REFRESH_FAILED')
    const json = await res.json() as { data: AdminCategory[] }
    setCategories(json.data)
  }

  async function submitCategory(formData: FormData) {
    const payload = categoryPayload(formData)
    const isEdit = dialog?.kind === 'category-edit'
    const endpoint = isEdit
      ? `/api/admin/taxonomy/categories/${dialog.category.id}`
      : '/api/admin/taxonomy/categories'

    await submitJson(endpoint, isEdit ? 'PATCH' : 'POST', payload)
  }

  async function submitSubCategory(formData: FormData) {
    const payload = subCategoryPayload(formData)
    const isEdit = dialog?.kind === 'subcategory-edit'
    const endpoint = isEdit
      ? `/api/admin/taxonomy/subcategories/${dialog.subcategory.id}`
      : `/api/admin/taxonomy/categories/${dialog?.kind === 'subcategory-create' ? dialog.category.id : ''}/subcategories`

    await submitJson(endpoint, isEdit ? 'PATCH' : 'POST', payload)
  }

  async function submitJson(endpoint: string, method: 'POST' | 'PATCH', payload: object) {
    setError(null)
    startTransition(async () => {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { code?: string; message?: string } }
        setError(json.error?.message ?? 'Action impossible')
        return
      }
      await refreshTaxonomy()
      setDialog(null)
    })
  }

  async function disableCategory(category: AdminCategory) {
    await submitJson(`/api/admin/taxonomy/categories/${category.id}`, 'PATCH', { is_active: false })
    setDisableDialog(null)
  }

  async function disableSubCategory(subcategory: AdminSubCategory) {
    await submitJson(`/api/admin/taxonomy/subcategories/${subcategory.id}`, 'PATCH', { is_active: false })
    setDisableDialog(null)
  }

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      {/* Header Section */}
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Taxonomie
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Taxonomie globale
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Catégories et sous-catégories globales du Guide. Les slugs verrouillés protègent les URLs,
            caches, personnalisations et historiques existants.
          </p>
        </div>

        <Dialog open={dialog?.kind === 'category-create'} onOpenChange={open => setDialog(open ? { kind: 'category-create' } : null)}>
          <DialogTrigger asChild>
            <button className="group flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md">
              <Plus size={16} className="transition-transform duration-300 group-hover:scale-110" />
              Nouvelle catégorie
            </button>
          </DialogTrigger>
          <CategoryDialogContent
            title="Nouvelle catégorie"
            isPending={isPending}
            error={error}
            onSubmit={submitCategory}
          />
        </Dialog>
      </header>

      {/* Table Section */}
      <div className="w-full overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
            <p className="text-sm font-medium text-gray-500">Aucune catégorie configurée.</p>
            <p className="mt-1 text-xs text-gray-400">Créez une catégorie pour initialiser la taxonomie.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Ordre</th>
                  <th className="px-4 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Icône</th>
                  <th className="px-4 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Nom</th>
                  <th className="px-4 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Slug</th>
                  <th className="px-4 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Statut</th>
                  <th className="px-4 py-4 text-center text-[10px] font-semibold tracking-widest text-gray-400 uppercase">POI Actifs</th>
                  <th className="px-4 py-4 text-center text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Sous-Cat.</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80 bg-white">
                {categories.map(category => (
                  <TaxonomyCategoryRow
                    key={category.id}
                    category={category}
                    isPending={isPending}
                    onEdit={() => setDialog({ kind: 'category-edit', category })}
                    onCreateSubCategory={() => setDialog({ kind: 'subcategory-create', category })}
                    onEditSubCategory={subcategory => setDialog({ kind: 'subcategory-edit', subcategory })}
                    onDisableCategory={() => setDisableDialog({ kind: 'category', category })}
                    onDisableSubCategory={subcategory => setDisableDialog({ kind: 'subcategory', subcategory })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs pour Edition / Création */}
      <Dialog open={dialog?.kind === 'category-edit'} onOpenChange={open => !open && setDialog(null)}>
        {dialog?.kind === 'category-edit' && (
          <CategoryDialogContent
            title={`Modifier ${dialog.category.name}`}
            category={dialog.category}
            isPending={isPending}
            error={error}
            onSubmit={submitCategory}
          />
        )}
      </Dialog>

      <Dialog open={dialog?.kind === 'subcategory-create'} onOpenChange={open => !open && setDialog(null)}>
        {dialog?.kind === 'subcategory-create' && (
          <SubCategoryDialogContent
            title={`Nouvelle sous-catégorie — ${dialog.category.name}`}
            isPending={isPending}
            error={error}
            onSubmit={submitSubCategory}
          />
        )}
      </Dialog>

      <Dialog open={dialog?.kind === 'subcategory-edit'} onOpenChange={open => !open && setDialog(null)}>
        {dialog?.kind === 'subcategory-edit' && (
          <SubCategoryDialogContent
            title={`Modifier ${dialog.subcategory.name}`}
            subcategory={dialog.subcategory}
            isPending={isPending}
            error={error}
            onSubmit={submitSubCategory}
          />
        )}
      </Dialog>

      {/* Dialog de confirmation de désactivation */}
      <Dialog open={disableDialog !== null} onOpenChange={open => !open && setDisableDialog(null)}>
        {disableDialog && (
          <DialogContent className="bg-white rounded-[25px] border-none shadow-xl sm:max-w-[425px] p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 text-lg font-bold">
                <AlertCircle className="h-5 w-5" />
                Désactiver l'élément
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-gray-500">
                Cette action masque l'élément du Guide quand les règles publiques l'exigent, mais conserve
                l'historique et les références existantes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-[13px] text-gray-600">
              Confirmez-vous la désactivation de <span className="font-bold text-neutral-900 border-b border-gray-200 pb-0.5">
                {disableDialog.kind === 'category' ? disableDialog.category.name : disableDialog.subcategory.name}
              </span> ?
            </div>
            <DialogFooter className="mt-4 flex gap-3">
              <Button type="button" variant="outline" onClick={() => setDisableDialog(null)} className="h-10 rounded-xl bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 flex-1">
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (disableDialog.kind === 'category') {
                    void disableCategory(disableDialog.category)
                    return
                  }
                  void disableSubCategory(disableDialog.subcategory)
                }}
                className="h-10 rounded-xl bg-rose-600 text-white hover:bg-rose-700 flex-1"
              >
                {isPending ? 'En cours...' : 'Désactiver'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function TaxonomyCategoryRow({
  category,
  isPending,
  onEdit,
  onCreateSubCategory,
  onEditSubCategory,
  onDisableCategory,
  onDisableSubCategory,
}: {
  category: AdminCategory
  isPending: boolean
  onEdit: () => void
  onCreateSubCategory: () => void
  onEditSubCategory: (subcategory: AdminSubCategory) => void
  onDisableCategory: () => void
  onDisableSubCategory: (subcategory: AdminSubCategory) => void
}) {
  const Icon = getLucideIconComponent(category.icon)

  return (
    <>
      {/* Category Row */}
      <tr className="group transition-colors duration-200 hover:bg-gray-50/50">
        <td className="px-6 py-3 font-mono text-[11px] font-semibold text-gray-400">{category.sort_order}</td>
        <td className="px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F7FE] text-[#0B1437]">
            <Icon size={14} strokeWidth={2.5} aria-label={category.icon} />
          </div>
        </td>
        <td className="px-4 py-3 text-[13px] font-bold text-neutral-900">{category.name}</td>
        <td className="px-4 py-3">
          <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 font-mono text-[10px] text-gray-500">
            {category.slug}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadges isActive={category.is_active} slugLocked={category.slug_locked} />
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-md bg-[#F4F7FE]/60 px-1.5 py-0.5 text-[11px] font-bold text-[#0B1437]">
            {category.poi_count}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-md bg-[#F4F7FE]/60 px-1.5 py-0.5 text-[11px] font-bold text-[#0B1437]">
            {category.subcategory_count}
          </span>
        </td>
        <td className="px-6 py-3 text-right">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-[30px] items-center gap-1.5 rounded-lg bg-[#F4F7FE] px-3 text-[11px] font-bold text-[#0B1437] transition-all hover:bg-[#0B1437] hover:text-white"
            >
              <Edit2 size={12} />
              Modifier
            </button>
            <button
              type="button"
              onClick={onCreateSubCategory}
              className="flex h-[30px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-600 transition-all hover:bg-gray-50 hover:text-neutral-900"
            >
              <Plus size={12} />
              Sous-cat.
            </button>
            <button
              type="button"
              disabled={!category.is_active || isPending}
              onClick={onDisableCategory}
              className="flex h-[30px] items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-2 text-[11px] font-bold text-rose-600 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="Désactiver"
            >
              <Power size={12} />
            </button>
          </div>
        </td>
      </tr>
      
      {/* SubCategory Rows */}
      {category.subcategories.map(subcategory => (
        <tr key={subcategory.id} className="group bg-gray-50/30 transition-colors hover:bg-gray-50/80 border-t border-dashed border-gray-100">
          <td className="px-6 py-2.5 pl-12">
            <div className="flex items-center gap-2 text-gray-300">
              <span>↳</span>
              <span className="font-mono text-[10px] font-semibold text-gray-400">{subcategory.sort_order}</span>
            </div>
          </td>
          <td className="px-4 py-2.5"></td>
          <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-700">{subcategory.name}</td>
          <td className="px-4 py-2.5">
            <span className="rounded-md border border-gray-100 bg-white px-2 py-0.5 font-mono text-[10px] text-gray-400">
              {subcategory.slug}
            </span>
          </td>
          <td className="px-4 py-2.5">
            <StatusBadges isActive={subcategory.is_active} slugLocked={subcategory.slug_locked} />
          </td>
          <td className="px-4 py-2.5 text-center">
            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-md border border-gray-100 bg-white px-1.5 py-0.5 text-[11px] font-bold text-gray-500">
              {subcategory.poi_count}
            </span>
          </td>
          <td className="px-4 py-2.5"></td>
          <td className="px-6 py-2.5 text-right">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onEditSubCategory(subcategory)}
                className="flex h-[26px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[10px] font-bold text-gray-600 transition-all hover:bg-gray-50 hover:text-neutral-900"
              >
                <Edit2 size={10} />
                Modifier
              </button>
              <button
                type="button"
                disabled={!subcategory.is_active || isPending}
                onClick={() => onDisableSubCategory(subcategory)}
                className="flex h-[26px] items-center gap-1.5 rounded-lg border border-rose-100 bg-white px-2 text-[10px] font-bold text-rose-500 transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                title="Désactiver"
              >
                <Power size={10} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

function StatusBadges({ isActive, slugLocked }: { isActive: boolean; slugLocked: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
        isActive ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50' : 'bg-gray-100/80 text-gray-500 border-gray-200/50'
      }`}>
        {isActive ? 'Actif' : 'Inactif'}
      </span>
      {slugLocked && (
        <span className="inline-flex items-center rounded border border-amber-100/50 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
          Slug Verrouillé
        </span>
      )}
    </div>
  )
}

/* Modales d'édition (Corporate Style) */

function CategoryDialogContent({
  title,
  category,
  error,
  isPending,
  onSubmit,
}: {
  title: string
  category?: AdminCategory
  error: string | null
  isPending: boolean
  onSubmit: (formData: FormData) => Promise<void>
}) {
  return (
    <DialogContent className="bg-white rounded-[25px] border-none shadow-xl sm:max-w-[480px] p-8">
      <form action={onSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">{title}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 pt-1">
            Le champ slug est désactivé si cette catégorie est utilisée par des POI ou dépendances actives.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <TextField name="name" label="Nom" defaultValue={category?.name} />
          <TextField name="slug" label="Slug (Optionnel)" defaultValue={category?.slug} disabled={category?.slug_locked} />
          <TextField name="icon" label="Icône Lucide" defaultValue={category?.icon ?? 'utensils'} />
          <NumberField name="sort_order" label="Ordre d'affichage" defaultValue={category?.sort_order ?? 0} />
          
          <ActiveField defaultChecked={category?.is_active ?? true} />
          <IconPreview iconSlug={category?.icon ?? 'utensils'} />
          
          {error && <p className="text-[13px] font-bold text-rose-600 p-3 bg-rose-50 rounded-xl">{error}</p>}
        </div>

        <DialogFooter className="pt-2">
          <Button type="submit" className="h-[52px] w-full rounded-xl bg-[#0B1437] text-[13px] font-bold text-white hover:bg-gray-900" disabled={isPending}>
            {isPending ? 'Enregistrement en cours...' : 'Enregistrer la catégorie'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function SubCategoryDialogContent({
  title,
  subcategory,
  error,
  isPending,
  onSubmit,
}: {
  title: string
  subcategory?: AdminSubCategory
  error: string | null
  isPending: boolean
  onSubmit: (formData: FormData) => Promise<void>
}) {
  return (
    <DialogContent className="bg-white rounded-[25px] border-none shadow-xl sm:max-w-[480px] p-8">
      <form action={onSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">{title}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 pt-1">
            Le parent principal n'est pas modifiable depuis cette interface.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <TextField name="name" label="Nom" defaultValue={subcategory?.name} />
          <TextField name="slug" label="Slug (Optionnel)" defaultValue={subcategory?.slug} disabled={subcategory?.slug_locked} />
          <NumberField name="sort_order" label="Ordre d'affichage" defaultValue={subcategory?.sort_order ?? 0} />
          
          <ActiveField defaultChecked={subcategory?.is_active ?? true} />

          {error && <p className="text-[13px] font-bold text-rose-600 p-3 bg-rose-50 rounded-xl">{error}</p>}
        </div>

        <DialogFooter className="pt-2">
          <Button type="submit" className="h-[52px] w-full rounded-xl bg-[#0B1437] text-[13px] font-bold text-white hover:bg-gray-900" disabled={isPending}>
            {isPending ? 'Enregistrement en cours...' : 'Enregistrer la sous-catégorie'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

/* Fields Styling */

function TextField({
  name,
  label,
  defaultValue,
  disabled = false,
}: {
  name: string
  label: string
  defaultValue?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">{label}</label>
      <input 
        id={name} 
        name={name} 
        defaultValue={defaultValue} 
        disabled={disabled} 
        required={!disabled} 
        className="w-full h-[52px] rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
      />
      {disabled && <p className="text-[10px] font-semibold text-amber-500 mt-1">Slug verrouillé pour préserver les relations actives.</p>}
    </div>
  )
}

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">{label}</label>
      <input 
        id={name} 
        name={name} 
        type="number" 
        defaultValue={defaultValue} 
        required 
        className="w-full h-[52px] rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
      />
    </div>
  )
}

function ActiveField({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex w-fit cursor-pointer select-none items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:bg-gray-50">
      <input 
        name="is_active" 
        type="checkbox" 
        defaultChecked={defaultChecked} 
        className="h-4 w-4 rounded-[4px] border-gray-300 text-[#0B1437] focus:ring-[#0B1437]"
        style={{ accentColor: '#0B1437' }}
      />
      <span className="text-[13px] font-bold text-neutral-900">Activer cet élément publiquement</span>
    </label>
  )
}

function IconPreview({ iconSlug }: { iconSlug: string }) {
  const Icon = getLucideIconComponent(iconSlug)
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Preview Icône</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
           <Icon className="h-5 w-5 text-[#0B1437]" />
        </div>
        <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
          Les icônes autorisées sont issues de la librairie Lucide.<br/>
          Exemples : <span className="font-mono text-[10px] font-bold text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-100">
             {Object.keys(LUCIDE_ICON_COMPONENTS).slice(0, 4).join(', ')}...
          </span>
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
   Business Logic Extractors (Maintained Identical)
   ------------------------------------------------------------------------- */

function categoryPayload(formData: FormData) {
  return {
    name: stringValue(formData, 'name'),
    slug: optionalStringValue(formData, 'slug'),
    icon: stringValue(formData, 'icon'),
    sort_order: numberValue(formData, 'sort_order'),
    is_active: formData.get('is_active') === 'on',
  }
}

function subCategoryPayload(formData: FormData) {
  return {
    name: stringValue(formData, 'name'),
    slug: optionalStringValue(formData, 'slug'),
    sort_order: numberValue(formData, 'sort_order'),
    is_active: formData.get('is_active') === 'on',
  }
}

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function optionalStringValue(formData: FormData, key: string): string | undefined {
  const value = stringValue(formData, key)
  return value.length > 0 ? value : undefined
}

function numberValue(formData: FormData, key: string): number {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : 0
}