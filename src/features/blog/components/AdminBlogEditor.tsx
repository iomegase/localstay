'use client'

import { useMemo, useState } from 'react'
import type { BlogArticleCategory, BlogArticleStatus } from '../types'
import { blogCategoryLabel } from '../lib/category-label'

type CityOption = {
  id: string
  name: string
}

type Photo = {
  id: string
  kind: 'cover' | 'gallery'
  url: string
  alt: string
  sort_order: number
}

type DraftSuggestion = {
  id: string
  status: string
  suggestion_title?: string | null
  suggestion_excerpt?: string | null
  suggestion_markdown?: string | null
  suggestion_seo_title?: string | null
  suggestion_seo_description?: string | null
} | null

type ArticleState = {
  id: string | null
  status: BlogArticleStatus
  title: string
  slug: string
  excerpt: string
  content_markdown: string
  category: BlogArticleCategory
  tags: string
  city_id: string
  seo_title: string
  seo_description: string
  photos: Photo[]
}

export function AdminBlogEditor({
  initialArticle,
  cities,
}: {
  initialArticle?: {
    id: string
    status: BlogArticleStatus
    title: string
    slug: string
    excerpt: string
    content_markdown: string
    category: BlogArticleCategory
    tags: string[]
    city_id: string | null
    seo_title: string | null
    seo_description: string | null
    photos: Photo[]
  }
  cities: CityOption[]
}) {
  const [article, setArticle] = useState<ArticleState>({
    id: initialArticle?.id ?? null,
    status: initialArticle?.status ?? 'draft',
    title: initialArticle?.title ?? '',
    slug: initialArticle?.slug ?? '',
    excerpt: initialArticle?.excerpt ?? '',
    content_markdown: initialArticle?.content_markdown ?? '',
    category: initialArticle?.category ?? 'local_guide',
    tags: initialArticle?.tags.join(', ') ?? '',
    city_id: initialArticle?.city_id ?? '',
    seo_title: initialArticle?.seo_title ?? '',
    seo_description: initialArticle?.seo_description ?? '',
    photos: initialArticle?.photos ?? [],
  })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [coverAlt, setCoverAlt] = useState('')
  const [galleryAlt, setGalleryAlt] = useState('')
  const [brief, setBrief] = useState('')
  const [verifiedFacts, setVerifiedFacts] = useState('')
  const [draftSuggestion, setDraftSuggestion] = useState<DraftSuggestion>(null)

  const sortedPhotos = useMemo(
    () => [...article.photos].sort((a, b) => a.sort_order - b.sort_order),
    [article.photos],
  )

  function payload() {
    return {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content_markdown: article.content_markdown,
      category: article.category,
      tags: article.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      city_id: article.city_id || null,
      seo_title: article.seo_title || null,
      seo_description: article.seo_description || null,
    }
  }

  async function saveArticle() {
    setBusy('save')
    setError(null)
    try {
      const response = await fetch(article.id ? `/api/admin/blog/${article.id}` : '/api/admin/blog', {
        method: article.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Enregistrement impossible')
        return
      }
      if (!article.id && json.id) {
        window.location.href = `/admin/blog/${json.id}`
        return
      }
      setArticle(current => ({ ...current, status: json.status ?? current.status }))
    } finally {
      setBusy(null)
    }
  }

  async function transition(route: 'submit-review' | 'publish' | 'archive') {
    if (!article.id) return
    setBusy(route)
    setError(null)
    try {
      const response = await fetch(`/api/admin/blog/${article.id}/${route}`, { method: 'POST' })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Transition impossible')
        return
      }
      setArticle(current => ({ ...current, status: json.status ?? current.status }))
    } finally {
      setBusy(null)
    }
  }

  async function generateDraft() {
    if (!article.id) {
      setError('Enregistrez d’abord le brouillon avant de lancer Gemini.')
      return
    }
    setBusy('generate')
    setError(null)
    try {
      const response = await fetch(`/api/admin/blog/${article.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, verified_facts: verifiedFacts }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Génération impossible')
        return
      }
      setDraftSuggestion(json)
    } finally {
      setBusy(null)
    }
  }

  async function applyDraft() {
    if (!article.id || !draftSuggestion?.id) return
    setBusy('apply')
    setError(null)
    try {
      const response = await fetch(`/api/admin/blog/${article.id}/apply-generation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: draftSuggestion.id }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Application impossible')
        return
      }
      setArticle(current => ({
        ...current,
        title: json.title ?? current.title,
        excerpt: json.excerpt ?? current.excerpt,
        content_markdown: json.content_markdown ?? current.content_markdown,
        seo_title: json.seo_title ?? current.seo_title,
        seo_description: json.seo_description ?? current.seo_description,
      }))
    } finally {
      setBusy(null)
    }
  }

  async function uploadSinglePhoto(kind: 'cover' | 'gallery', file: File, alt: string, sortOrder = 0) {
    if (!article.id) {
      setError('Enregistrez d’abord le brouillon avant d’ajouter des photos.')
      return
    }
    const formData = new FormData()
    formData.set('file', file)
    formData.set('kind', kind)
    formData.set('alt', alt)
    formData.set('sort_order', String(sortOrder))

    const response = await fetch(`/api/admin/blog/${article.id}/photos`, {
      method: 'POST',
      body: formData,
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error?.message ?? 'Upload impossible')
      return
    }
    setArticle(current => ({
      ...current,
      photos: kind === 'cover'
        ? [json, ...current.photos.filter(photo => photo.kind !== 'cover')]
        : [...current.photos, json],
    }))
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Contenu</h2>
          <Field label="Titre">
            <input value={article.title} onChange={event => setArticle({ ...article, title: event.target.value })} className={inputClassName} />
          </Field>
          <Field label="Slug">
            <input value={article.slug} onChange={event => setArticle({ ...article, slug: event.target.value })} className={inputClassName} />
          </Field>
          <Field label="Excerpt">
            <textarea value={article.excerpt} onChange={event => setArticle({ ...article, excerpt: event.target.value })} rows={4} className={textareaClassName} />
          </Field>
          <Field label="Markdown">
            <textarea
              value={article.content_markdown}
              onChange={event => setArticle({ ...article, content_markdown: event.target.value })}
              rows={14}
              className={textareaClassName}
            />
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Configuration</h2>
          <Field label="Catégorie">
            <select
              value={article.category}
              onChange={event => setArticle({ ...article, category: event.target.value as BlogArticleCategory })}
              className={inputClassName}
            >
              {(['local_guide', 'lodging', 'restaurants', 'activities', 'travel_tips'] as BlogArticleCategory[]).map(category => (
                <option key={category} value={category}>{blogCategoryLabel(category)}</option>
              ))}
            </select>
          </Field>
          <Field label="Ville">
            <select value={article.city_id} onChange={event => setArticle({ ...article, city_id: event.target.value })} className={inputClassName}>
              <option value="">Aucune ville</option>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </Field>
          <Field label="Tags (virgules)">
            <input value={article.tags} onChange={event => setArticle({ ...article, tags: event.target.value })} className={inputClassName} />
          </Field>
          <Field label="SEO title">
            <input value={article.seo_title} onChange={event => setArticle({ ...article, seo_title: event.target.value })} className={inputClassName} />
          </Field>
          <Field label="SEO description">
            <textarea value={article.seo_description} onChange={event => setArticle({ ...article, seo_description: event.target.value })} rows={5} className={textareaClassName} />
          </Field>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Statut actuel: <span className="font-semibold text-slate-900">{article.status}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Photos</h2>
          <Field label="Alt couverture">
            <input value={coverAlt} onChange={event => setCoverAlt(event.target.value)} className={inputClassName} />
          </Field>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            onChange={async event => {
              const file = event.target.files?.[0]
              if (file) await uploadSinglePhoto('cover', file, coverAlt)
            }}
          />
          <Field label="Alt galerie">
            <input value={galleryAlt} onChange={event => setGalleryAlt(event.target.value)} className={inputClassName} />
          </Field>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            onChange={async event => {
              const files = Array.from(event.target.files ?? [])
              for (const [index, file] of files.entries()) {
                await uploadSinglePhoto('gallery', file, galleryAlt, index)
              }
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedPhotos.map(photo => (
              <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">
                <img src={photo.url} alt={photo.alt} className="h-32 w-full object-cover" />
                <div className="space-y-1 px-3 py-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{photo.kind === 'cover' ? 'Couverture' : 'Galerie'}</p>
                  <p>{photo.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Gemini</h2>
          <Field label="Brief">
            <textarea value={brief} onChange={event => setBrief(event.target.value)} rows={5} className={textareaClassName} />
          </Field>
          <Field label="Faits vérifiés">
            <textarea value={verifiedFacts} onChange={event => setVerifiedFacts(event.target.value)} rows={7} className={textareaClassName} />
          </Field>
          <button type="button" onClick={generateDraft} className={primaryButtonClassName} disabled={busy !== null}>
            {busy === 'generate' ? 'Génération…' : 'Générer un brouillon'}
          </button>

          {draftSuggestion && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">{draftSuggestion.suggestion_title}</p>
              <p>{draftSuggestion.suggestion_excerpt}</p>
              <button type="button" onClick={applyDraft} className={secondaryButtonClassName} disabled={busy !== null}>
                {busy === 'apply' ? 'Application…' : 'Appliquer à l’article'}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={saveArticle} className={primaryButtonClassName} disabled={busy !== null}>
          {busy === 'save' ? 'Enregistrement…' : article.id ? 'Enregistrer' : 'Créer le brouillon'}
        </button>
        {article.id && (
          <>
            <button type="button" onClick={() => transition('submit-review')} className={secondaryButtonClassName} disabled={busy !== null}>
              {busy === 'submit-review' ? 'Transition…' : 'Passer en review'}
            </button>
            <button type="button" onClick={() => transition('publish')} className={secondaryButtonClassName} disabled={busy !== null}>
              {busy === 'publish' ? 'Publication…' : 'Publier'}
            </button>
            <button type="button" onClick={() => transition('archive')} className={secondaryButtonClassName} disabled={busy !== null}>
              {busy === 'archive' ? 'Archivage…' : 'Archiver'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClassName = 'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 focus:border-[#0B1437]'
const textareaClassName = `${inputClassName} min-h-[120px]`
const primaryButtonClassName = 'inline-flex items-center justify-center rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-semibold text-white'
const secondaryButtonClassName = 'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900'
