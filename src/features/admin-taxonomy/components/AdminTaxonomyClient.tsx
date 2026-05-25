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
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

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
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="group">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
            Taxonomie
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-slate-900 transition-colors">
            Taxonomie globale
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Catégories et sous-catégories globales du Guide. Les slugs verrouillés protègent les URLs,
            caches, personnalisations et historiques existants.
          </p>
        </div>

        <Dialog open={dialog?.kind === 'category-create'} onOpenChange={open => setDialog(open ? { kind: 'category-create' } : null)}>
          <DialogTrigger asChild>
            <button className="group relative flex h-10 w-fit shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-200">
              <span className="relative z-10 flex items-center gap-2">
                <Plus size={16} />
                Nouvelle catégorie
              </span>
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

      <div className="w-full overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        {categories.length === 0 ? (
          <div className="flex h-48 w-full flex-col items-center justify-center border-b border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-sm font-medium text-slate-600">Aucune catégorie configurée.</p>
            <p className="mt-1 text-xs text-slate-400">Créez une catégorie pour initialiser la taxonomie.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase md:px-10">Ordre</th>
                  <th className="px-4 py-5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Icône</th>
                  <th className="px-4 py-5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Nom</th>
                  <th className="px-4 py-5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Slug</th>
                  <th className="px-4 py-5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Statut</th>
                  <th className="px-4 py-5 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">POI Actifs</th>
                  <th className="px-4 py-5 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Sous-Catégories</th>
                  <th className="px-6 py-5 text-right text-[11px] font-semibold tracking-wider text-slate-500 uppercase md:px-10">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
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

      <Dialog open={disableDialog !== null} onOpenChange={open => !open && setDisableDialog(null)}>
        {disableDialog && (
          <DialogContent className="bg-white text-slate-950 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="h-5 w-5" />
                Désactiver l'élément
              </DialogTitle>
              <DialogDescription className="pt-2 text-slate-600">
                Cette action masque l'élément du Guide quand les règles publiques l'exigent, mais conserve
                l'historique et les références existantes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-slate-700">
              Confirmez-vous la désactivation de <span className="font-bold text-slate-900 border-b border-slate-200">
                {disableDialog.kind === 'category' ? disableDialog.category.name : disableDialog.subcategory.name}
              </span> ?
            </div>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDisableDialog(null)} className="rounded-xl">
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl shadow-sm"
                disabled={isPending}
                onClick={() => {
                  if (disableDialog.kind === 'category') {
                    void disableCategory(disableDialog.category)
                    return
                  }
                  void disableSubCategory(disableDialog.subcategory)
                }}
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
      <tr className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50">
        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-400 md:px-10">{category.sort_order}</td>
        <td className="px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-colors group-hover:bg-indigo-100">
            <Icon size={18} strokeWidth={2.5} aria-label={category.icon} />
          </div>
        </td>
        <td className="px-4 py-4 font-bold text-slate-800">{category.name}</td>
        <td className="px-4 py-4">
          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-500">
            {category.slug}
          </span>
        </td>
        <td className="px-4 py-4">
          <StatusBadges isActive={category.is_active} slugLocked={category.slug_locked} />
        </td>
        <td className="px-4 py-4 text-center">
          <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-xl bg-slate-50 px-2 py-1 text-sm font-bold text-slate-700">
            {category.poi_count}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-xl bg-slate-50 px-2 py-1 text-sm font-bold text-slate-700">
            {category.subcategory_count}
          </span>
        </td>
        <td className="px-6 py-4 text-right md:px-10">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
            >
              <Edit2 size={13} />
              Modifier
            </button>
            <button
              type="button"
              onClick={onCreateSubCategory}
              className="flex h-8 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100"
            >
              <Plus size={13} />
              Sous-catégorie
            </button>
            <button
              type="button"
              disabled={!category.is_active || isPending}
              onClick={onDisableCategory}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Power size={13} />
              <span className="hidden xl:inline">Désactiver</span>
            </button>
          </div>
        </td>
      </tr>
      
      {category.subcategories.map(subcategory => (
        <tr key={subcategory.id} className="group border-b border-slate-50 bg-slate-50/40 transition-colors hover:bg-slate-50">
          <td className="px-6 py-3 pl-8 md:px-10 md:pl-12">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-300">↳</span>
              <span className="font-mono text-xs font-medium">{subcategory.sort_order}</span>
            </div>
          </td>
          <td className="px-4 py-3"></td>
          <td className="px-4 py-3 font-semibold text-slate-700">{subcategory.name}</td>
          <td className="px-4 py-3">
            <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-500 border border-slate-100">
              {subcategory.slug}
            </span>
          </td>
          <td className="px-4 py-3">
            <StatusBadges isActive={subcategory.is_active} slugLocked={subcategory.slug_locked} />
          </td>
          <td className="px-4 py-3 text-center">
            <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-600 border border-slate-100/50">
              {subcategory.poi_count}
            </span>
          </td>
          <td className="px-4 py-3"></td>
          <td className="px-6 py-3 text-right md:px-10">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onEditSubCategory(subcategory)}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
              >
                <Edit2 size={12} />
                Modifier
              </button>
              <button
                type="button"
                disabled={!subcategory.is_active || isPending}
                onClick={() => onDisableSubCategory(subcategory)}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-rose-100 bg-white px-2.5 text-xs font-medium text-rose-500 shadow-sm transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Power size={12} />
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
    <div className="flex flex-wrap gap-2">
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-slate-100 text-slate-500 border border-slate-200/50'
      }`}>
        {isActive ? 'Actif' : 'Inactif'}
      </span>
      {slugLocked && (
        <span className="inline-flex items-center rounded-full border border-amber-200/50 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
          Slug Verrouillé
        </span>
      )}
    </div>
  )
}

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
    <DialogContent className="bg-white text-slate-950 sm:max-w-[450px]">
      <form action={onSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Le champ slug est désactivé si cette catégorie est utilisée par des POI ou dépendances actives.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <TextField name="name" label="Nom" defaultValue={category?.name} />
          <TextField name="slug" label="Slug (Optionnel)" defaultValue={category?.slug} disabled={category?.slug_locked} />
          <TextField name="icon" label="Icône Lucide" defaultValue={category?.icon ?? 'utensils'} />
          <NumberField name="sort_order" label="Ordre d'affichage" defaultValue={category?.sort_order ?? 0} />
          
          <div className="pt-2">
            <ActiveField defaultChecked={category?.is_active ?? true} />
          </div>
          
          <IconPreview iconSlug={category?.icon ?? 'utensils'} />
          
          {error && <p className="text-sm font-semibold text-rose-600 p-3 bg-rose-50 rounded-xl">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
            {isPending ? 'Enregistrement en cours...' : 'Enregistrer'}
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
    <DialogContent className="bg-white text-slate-950 sm:max-w-[450px]">
      <form action={onSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Le parent principal n'est pas modifiable depuis cette interface.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <TextField name="name" label="Nom" defaultValue={subcategory?.name} />
          <TextField name="slug" label="Slug (Optionnel)" defaultValue={subcategory?.slug} disabled={subcategory?.slug_locked} />
          <NumberField name="sort_order" label="Ordre d'affichage" defaultValue={subcategory?.sort_order ?? 0} />
          
          <div className="pt-2">
            <ActiveField defaultChecked={subcategory?.is_active ?? true} />
          </div>

          {error && <p className="text-sm font-semibold text-rose-600 p-3 bg-rose-50 rounded-xl">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
            {isPending ? 'Enregistrement en cours...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

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
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-semibold text-slate-700">{label}</Label>
      <Input 
        id={name} 
        name={name} 
        defaultValue={defaultValue} 
        disabled={disabled} 
        required={!disabled} 
        className="rounded-xl border-slate-200 transition-colors focus-visible:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
      />
      {disabled && <p className="text-xs text-amber-600 mt-1">Slug verrouillé pour préserver les relations actives.</p>}
    </div>
  )
}

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-semibold text-slate-700">{label}</Label>
      <Input 
        id={name} 
        name={name} 
        type="number" 
        defaultValue={defaultValue} 
        required 
        className="rounded-xl border-slate-200 transition-colors focus-visible:ring-indigo-500"
      />
    </div>
  )
}

function ActiveField({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:bg-slate-50">
      <input 
        name="is_active" 
        type="checkbox" 
        defaultChecked={defaultChecked} 
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
      />
      <span className="text-sm font-semibold text-slate-700">Activer cet élément</span>
    </label>
  )
}

function IconPreview({ iconSlug }: { iconSlug: string }) {
  const Icon = getLucideIconComponent(iconSlug)
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Preview Icône</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-indigo-100">
           <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <p className="text-xs font-medium text-slate-600 leading-relaxed">
          Les icônes autorisées sont issues de <br/>
          <span className="font-mono text-[10px] text-slate-500 bg-white px-1 py-0.5 rounded border border-slate-100">
             {Object.keys(LUCIDE_ICON_COMPONENTS).slice(0, 5).join(', ')}...
          </span>
        </p>
      </div>
    </div>
  )
}

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