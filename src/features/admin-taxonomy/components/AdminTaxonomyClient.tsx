"use client"

import { useState, useTransition } from 'react'
import { Plus, Power } from 'lucide-react'
import type { AdminCategory, AdminSubCategory } from '../types'
import { getLucideIconComponent, LUCIDE_ICON_COMPONENTS } from '../lib/icons'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Taxonomie</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Taxonomie globale</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Catégories et sous-catégories globales du Guide. Les slugs verrouillés protègent les URLs,
            caches, personnalisations et historiques existants.
          </p>
        </div>

        <Dialog open={dialog?.kind === 'category-create'} onOpenChange={open => setDialog(open ? { kind: 'category-create' } : null)}>
          <DialogTrigger asChild>
            <Button className="bg-amber-300 text-slate-950 hover:bg-amber-200">
              <Plus className="h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </DialogTrigger>
          <CategoryDialogContent
            title="Nouvelle catégorie"
            isPending={isPending}
            error={error}
            onSubmit={submitCategory}
          />
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card className="bg-white text-slate-950">
          <CardContent className="py-10 text-center">
            <p className="font-medium">Aucune catégorie configurée</p>
            <p className="mt-2 text-sm text-slate-500">Créer une catégorie pour initialiser la taxonomie.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white text-slate-950">
          <CardHeader>
            <CardTitle>Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Icône</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>POI actifs</TableHead>
                  <TableHead>Sous-catégories</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
          <DialogContent className="bg-white text-slate-950">
            <DialogHeader>
              <DialogTitle>Désactiver sans supprimer</DialogTitle>
              <DialogDescription>
                Cette action masque l&apos;élément du Guide quand les règles publiques l&apos;exigent, mais conserve
                l&apos;historique et les références existantes.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm">
              Confirmer la désactivation de{' '}
              <span className="font-semibold">
                {disableDialog.kind === 'category' ? disableDialog.category.name : disableDialog.subcategory.name}
              </span>
              {' '}?
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDisableDialog(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  if (disableDialog.kind === 'category') {
                    void disableCategory(disableDialog.category)
                    return
                  }
                  void disableSubCategory(disableDialog.subcategory)
                }}
              >
                Désactiver
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
      <TableRow>
        <TableCell>{category.sort_order}</TableCell>
        <TableCell>
          <Icon className="h-5 w-5 text-amber-700" aria-label={category.icon} />
        </TableCell>
        <TableCell className="font-medium">{category.name}</TableCell>
        <TableCell className="font-mono text-xs">{category.slug}</TableCell>
        <TableCell>
          <StatusBadges isActive={category.is_active} slugLocked={category.slug_locked} />
        </TableCell>
        <TableCell>{category.poi_count}</TableCell>
        <TableCell>{category.subcategory_count}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>Modifier</Button>
            <Button type="button" size="sm" variant="outline" onClick={onCreateSubCategory}>Nouvelle sous-catégorie</Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!category.is_active || isPending}
              onClick={onDisableCategory}
            >
              <Power className="h-4 w-4" />
              Désactiver
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {category.subcategories.map(subcategory => (
        <TableRow key={subcategory.id} className="bg-slate-50">
          <TableCell className="pl-8 text-slate-500">↳ {subcategory.sort_order}</TableCell>
          <TableCell />
          <TableCell>{subcategory.name}</TableCell>
          <TableCell className="font-mono text-xs">{subcategory.slug}</TableCell>
          <TableCell>
            <StatusBadges isActive={subcategory.is_active} slugLocked={subcategory.slug_locked} />
          </TableCell>
          <TableCell>{subcategory.poi_count}</TableCell>
          <TableCell />
          <TableCell>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onEditSubCategory(subcategory)}>Modifier</Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={!subcategory.is_active || isPending}
                onClick={() => onDisableSubCategory(subcategory)}
              >
                Désactiver
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function StatusBadges({ isActive, slugLocked }: { isActive: boolean; slugLocked: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'active' : 'inactive'}</Badge>
      {slugLocked && <Badge variant="outline">slug locked</Badge>}
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
    <DialogContent className="bg-white text-slate-950">
      <form action={onSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Le champ slug est désactivé si cette catégorie est utilisée par des POI ou dépendances actives.
          </DialogDescription>
        </DialogHeader>
        <TextField name="name" label="Nom" defaultValue={category?.name} />
        <TextField name="slug" label="Slug" defaultValue={category?.slug} disabled={category?.slug_locked} />
        <TextField name="icon" label="Icône Lucide" defaultValue={category?.icon ?? 'utensils'} />
        <NumberField name="sort_order" label="Ordre" defaultValue={category?.sort_order ?? 0} />
        <ActiveField defaultChecked={category?.is_active ?? true} />
        <IconPreview iconSlug={category?.icon ?? 'utensils'} />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <DialogFooter>
          <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
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
    <DialogContent className="bg-white text-slate-950">
      <form action={onSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Le parent Category n&apos;est pas modifiable dans cette spec.</DialogDescription>
        </DialogHeader>
        <TextField name="name" label="Nom" defaultValue={subcategory?.name} />
        <TextField name="slug" label="Slug" defaultValue={subcategory?.slug} disabled={subcategory?.slug_locked} />
        <NumberField name="sort_order" label="Ordre" defaultValue={subcategory?.sort_order ?? 0} />
        <ActiveField defaultChecked={subcategory?.is_active ?? true} />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <DialogFooter>
          <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
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
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} disabled={disabled} required={!disabled} />
      {disabled && <p className="text-xs text-slate-500">Slug verrouillé car cette catégorie est utilisée par des POI ou dépendances actives.</p>}
    </div>
  )
}

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" defaultValue={defaultValue} required />
    </div>
  )
}

function ActiveField({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input name="is_active" type="checkbox" defaultChecked={defaultChecked} />
      Actif
    </label>
  )
}

function IconPreview({ iconSlug }: { iconSlug: string }) {
  const Icon = getLucideIconComponent(iconSlug)
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Icônes autorisées</p>
      <div className="mt-2 flex items-center gap-3">
        <Icon className="h-5 w-5 text-amber-700" />
        <span className="font-mono text-xs">{Object.keys(LUCIDE_ICON_COMPONENTS).join(', ')}</span>
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
