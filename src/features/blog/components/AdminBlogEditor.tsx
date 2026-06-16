'use client'

import { useMemo, useRef, useState } from 'react'
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

type ApiErrorPayload = {
  error?: {
    message?: string
    details?: ApiErrorDetails
  }
}

type ApiErrorDetails = {
  fieldErrors?: Record<string, string[]>
  fields?: string[]
  [key: string]: unknown
}

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

function parseArticleStatus(value: unknown): BlogArticleStatus | null {
  return value === 'draft' || value === 'review' || value === 'published' || value === 'archived'
    ? value
    : null
}

function parseStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function countCharacters(value: string): number {
  return value.trim().length
}

function countWords(value: string): number {
  const trimmed = value.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Titre',
  slug: 'Slug',
  excerpt: 'Excerpt',
  content_markdown: 'Markdown',
  category: 'Catégorie',
  tags: 'Tags',
  city_id: 'Ville',
  seo_title: 'SEO title',
  seo_description: 'SEO description',
  brief: 'Brief',
  verified_facts: 'Faits vérifiés',
  alt: 'Texte alternatif',
  cover_alt: 'Alt couverture',
  gallery_alt: 'Alt galerie',
  cover_photo: 'Photo de couverture',
  file: 'Fichier',
  cover_file: 'Fichier couverture',
  gallery_file: 'Fichiers galerie',
}

function normalizeFieldErrors(details?: ApiErrorDetails) {
  const errors: Record<string, string[]> = {}
  if (!details || typeof details !== 'object') return errors

  const push = (field: string, messages: string[]) => {
    if (messages.length === 0) return
    errors[field] = [...(errors[field] ?? []), ...messages]
  }

  const detailEntries = Object.entries(details)
  for (const [key, value] of detailEntries) {
    if (key === 'fieldErrors' || key === 'fields') continue
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      push(key, value)
    }
  }

  if (details.fieldErrors && typeof details.fieldErrors === 'object') {
    for (const [field, messages] of Object.entries(details.fieldErrors)) {
      if (Array.isArray(messages)) {
        push(field, messages.filter((message): message is string => typeof message === 'string'))
      }
    }
  }

  if (Array.isArray(details.fields)) {
    for (const field of details.fields) {
      push(field, ['Champ requis avant publication.'])
    }
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, Array.from(new Set(messages))]),
  )
}

function formatFieldErrors(fieldErrors: Record<string, string[]>) {
  return Object.entries(fieldErrors).flatMap(([field, messages]) =>
    messages.map(message => `${FIELD_LABELS[field] ?? field} - ${message}`),
  )
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [coverAlt, setCoverAlt] = useState('')
  const [galleryAlt, setGalleryAlt] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [brief, setBrief] = useState('')
  const [verifiedFacts, setVerifiedFacts] = useState('')
  const [draftSuggestion, setDraftSuggestion] = useState<DraftSuggestion>(null)
  const coverFileInputRef = useRef<HTMLInputElement | null>(null)
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null)

  const sortedPhotos = useMemo(
    () => [...article.photos].sort((a, b) => a.sort_order - b.sort_order),
    [article.photos],
  )
  const validationSummary = useMemo(() => formatFieldErrors(fieldErrors), [fieldErrors])

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

  function resetErrors() {
    setError(null)
    setFieldErrors({})
  }

  function applyApiError(payload: ApiErrorPayload | null, fallbackMessage: string) {
    const nextFieldErrors = normalizeFieldErrors(payload?.error?.details)
    setFieldErrors(nextFieldErrors)
    setError(payload?.error?.message ?? fallbackMessage)
  }

  function applyPhotoApiError(kind: 'cover' | 'gallery', payload: ApiErrorPayload | null, fallbackMessage: string) {
    const normalized = normalizeFieldErrors(payload?.error?.details)
    const altKey = kind === 'cover' ? 'cover_alt' : 'gallery_alt'
    const fileKey = kind === 'cover' ? 'cover_file' : 'gallery_file'

    setFieldErrors(current => {
      const next = { ...current }
      delete next[altKey]
      delete next[fileKey]

      for (const [field, messages] of Object.entries(normalized)) {
        if (field === 'alt') {
          next[altKey] = messages
          continue
        }
        if (field === 'file') {
          next[fileKey] = messages
          continue
        }
        next[field] = messages
      }

      return next
    })

    setError(payload?.error?.message ?? fallbackMessage)
  }

  function clearFieldErrors(keys: string[]) {
    setFieldErrors(current => {
      const next = { ...current }
      for (const key of keys) {
        delete next[key]
      }

      if (Object.keys(next).length === 0) {
        setError(null)
      }

      return next
    })
  }

  function setArticleField<K extends keyof ArticleState>(field: K, value: ArticleState[K], errorKeys: string[] = [String(field)]) {
    setArticle(current => ({ ...current, [field]: value }))
    clearFieldErrors(errorKeys)
  }

  const titleLength = useMemo(() => countCharacters(article.title), [article.title])
  const excerptLength = useMemo(() => countCharacters(article.excerpt), [article.excerpt])
  const markdownCharacterCount = useMemo(() => countCharacters(article.content_markdown), [article.content_markdown])
  const markdownWordCount = useMemo(() => countWords(article.content_markdown), [article.content_markdown])
  const seoTitleLength = useMemo(() => countCharacters(article.seo_title), [article.seo_title])
  const seoDescriptionLength = useMemo(() => countCharacters(article.seo_description), [article.seo_description])

  async function persistArticle(navigation: 'none' | 'redirect' | 'replace-state' = 'none') {
    const response = await fetch(article.id ? `/api/admin/blog/${article.id}` : '/api/admin/blog', {
      method: article.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
    })
    const json = await response.json() as ApiErrorPayload & Record<string, unknown>
    if (!response.ok) {
      applyApiError(json, 'Enregistrement impossible')
      return null
    }

    const nextId = parseStringValue(json.id)
    const nextSlug = parseStringValue(json.slug)
    const nextStatus = parseArticleStatus(json.status)

    setArticle(current => ({
      ...current,
      id: nextId ?? current.id,
      slug: nextSlug ?? current.slug,
      status: nextStatus ?? current.status,
    }))

    if (!article.id && nextId) {
      if (navigation === 'redirect') {
        window.location.href = `/admin/blog/${nextId}`
      } else if (navigation === 'replace-state') {
        window.history.replaceState(null, '', `/admin/blog/${nextId}`)
      }
    }

    return nextId ?? article.id
  }

  async function saveArticle() {
    setBusy('save')
    resetErrors()
    try {
      await persistArticle(article.id ? 'none' : 'redirect')
    } finally {
      setBusy(null)
    }
  }

  async function transition(route: 'submit-review' | 'publish' | 'archive') {
    if (!article.id) return
    setBusy(route)
    resetErrors()
    try {
      const response = await fetch(`/api/admin/blog/${article.id}/${route}`, { method: 'POST' })
      const json = await response.json() as ApiErrorPayload & Record<string, unknown>
      if (!response.ok) {
        applyApiError(json, 'Transition impossible')
        return
      }
      setArticle(current => ({ ...current, status: parseArticleStatus(json.status) ?? current.status }))
    } finally {
      setBusy(null)
    }
  }

  async function deleteArticle() {
    if (!article.id) return
    setBusy('delete')
    resetErrors()
    try {
      const response = await fetch(`/api/admin/blog/${article.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const json = await response.json().catch(() => null) as ApiErrorPayload | null
        applyApiError(json, 'Suppression impossible')
        setConfirmDelete(false)
        return
      }
      window.location.href = '/admin/blog'
    } finally {
      setBusy(null)
    }
  }

  async function generateDraft() {
    setBusy('generate')
    resetErrors()
    try {
      const articleId = article.id ?? await persistArticle('replace-state')
      if (!articleId) return

      const response = await fetch(`/api/admin/blog/${articleId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, verified_facts: verifiedFacts }),
      })
      const json = await response.json() as ApiErrorPayload & DraftSuggestion
      if (!response.ok) {
        applyApiError(json, 'Génération impossible')
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
    resetErrors()
    try {
      const response = await fetch(`/api/admin/blog/${article.id}/apply-generation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: draftSuggestion.id }),
      })
      const json = await response.json() as ApiErrorPayload & Record<string, unknown>
      if (!response.ok) {
        applyApiError(json, 'Application impossible')
        return
      }
      setArticle(current => ({
        ...current,
        title: parseStringValue(json.title) ?? current.title,
        excerpt: parseStringValue(json.excerpt) ?? current.excerpt,
        content_markdown: parseStringValue(json.content_markdown) ?? current.content_markdown,
        seo_title: parseStringValue(json.seo_title) ?? current.seo_title,
        seo_description: parseStringValue(json.seo_description) ?? current.seo_description,
      }))
    } finally {
      setBusy(null)
    }
  }

  async function uploadSinglePhoto(kind: 'cover' | 'gallery', file: File, alt: string, sortOrder = 0) {
    if (!article.id) {
      setError('Enregistrez d’abord le brouillon avant d’ajouter des photos.')
      return null
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
    const json = await response.json() as ApiErrorPayload & Photo
    if (!response.ok) {
      applyPhotoApiError(kind, json, 'Upload impossible')
      return null
    }
    setArticle(current => ({
      ...current,
      photos: kind === 'cover'
        ? [json, ...current.photos.filter(photo => photo.kind !== 'cover')]
        : [...current.photos, json],
    }))

    if (kind === 'cover') {
      clearFieldErrors(['cover_photo', 'cover_alt', 'cover_file'])
    } else {
      clearFieldErrors(['gallery_alt', 'gallery_file'])
    }

    return json
  }

  async function handleCoverUpload() {
    if (!coverFile) return

    setBusy('upload-cover')
    clearFieldErrors(['cover_alt', 'cover_file'])
    try {
      const uploaded = await uploadSinglePhoto('cover', coverFile, coverAlt, 0)
      if (!uploaded) return

      setCoverAlt('')
      setCoverFile(null)
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = ''
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleGalleryUpload() {
    if (galleryFiles.length === 0) return

    setBusy('upload-gallery')
    clearFieldErrors(['gallery_alt', 'gallery_file'])
    try {
      const galleryCount = article.photos.filter(photo => photo.kind === 'gallery').length

      for (const [index, file] of galleryFiles.entries()) {
        const uploaded = await uploadSinglePhoto('gallery', file, galleryAlt, galleryCount + index)
        if (!uploaded) return
      }

      setGalleryAlt('')
      setGalleryFiles([])
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = ''
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p>{error}</p>
          {validationSummary.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationSummary.map(message => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Contenu</h2>
          <Field label="Titre" errors={fieldErrors.title}>
            <>
              <input value={article.title} onChange={event => setArticleField('title', event.target.value)} className={inputClassName(fieldErrors.title)} aria-invalid={fieldErrors.title?.length > 0} />
              <CharacterCounter current={titleLength} min={5} max={90} />
            </>
          </Field>
          <Field label="Slug" errors={fieldErrors.slug}>
            <input value={article.slug} onChange={event => setArticleField('slug', event.target.value)} className={inputClassName(fieldErrors.slug)} aria-invalid={fieldErrors.slug?.length > 0} />
          </Field>
          <Field label="Excerpt" errors={fieldErrors.excerpt}>
            <>
              <textarea value={article.excerpt} onChange={event => setArticleField('excerpt', event.target.value)} rows={4} className={textareaClassName(fieldErrors.excerpt)} aria-invalid={fieldErrors.excerpt?.length > 0} />
              <CharacterCounter current={excerptLength} min={40} max={220} />
            </>
          </Field>
          <Field label="Markdown" errors={fieldErrors.content_markdown}>
            <>
              <textarea
                value={article.content_markdown}
                onChange={event => setArticleField('content_markdown', event.target.value)}
                rows={14}
                className={textareaClassName(fieldErrors.content_markdown)}
                aria-invalid={fieldErrors.content_markdown?.length > 0}
              />
              <MarkdownCounter wordCount={markdownWordCount} characterCount={markdownCharacterCount} />
            </>
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Configuration</h2>
          <Field label="Catégorie" errors={fieldErrors.category}>
            <select
              value={article.category}
              onChange={event => setArticleField('category', event.target.value as BlogArticleCategory)}
              className={inputClassName(fieldErrors.category)}
              aria-invalid={fieldErrors.category?.length > 0}
            >
              {(['local_guide', 'lodging', 'restaurants', 'activities', 'travel_tips'] as BlogArticleCategory[]).map(category => (
                <option key={category} value={category}>{blogCategoryLabel(category)}</option>
              ))}
            </select>
          </Field>
          <Field label="Ville" errors={fieldErrors.city_id}>
            <select value={article.city_id} onChange={event => setArticleField('city_id', event.target.value)} className={inputClassName(fieldErrors.city_id)} aria-invalid={fieldErrors.city_id?.length > 0}>
              <option value="">Aucune ville</option>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </Field>
          <Field label="Tags (virgules)" errors={fieldErrors.tags}>
            <input value={article.tags} onChange={event => setArticleField('tags', event.target.value)} className={inputClassName(fieldErrors.tags)} aria-invalid={fieldErrors.tags?.length > 0} />
          </Field>
          <Field label="SEO title" errors={fieldErrors.seo_title}>
            <>
              <input value={article.seo_title} onChange={event => setArticleField('seo_title', event.target.value)} className={inputClassName(fieldErrors.seo_title)} aria-invalid={fieldErrors.seo_title?.length > 0} />
              <CharacterCounter current={seoTitleLength} min={30} max={70} />
            </>
          </Field>
          <Field label="SEO description" errors={fieldErrors.seo_description}>
            <>
              <textarea value={article.seo_description} onChange={event => setArticleField('seo_description', event.target.value)} rows={5} className={textareaClassName(fieldErrors.seo_description)} aria-invalid={fieldErrors.seo_description?.length > 0} />
              <CharacterCounter current={seoDescriptionLength} min={80} max={180} />
            </>
          </Field>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Statut actuel: <span className="font-semibold text-slate-900">{article.status}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Photos</h2>
          <Field label="Alt couverture" errors={fieldErrors.cover_alt}>
            <input
              value={coverAlt}
              onChange={event => {
                setCoverAlt(event.target.value)
                clearFieldErrors(['cover_alt'])
              }}
              className={inputClassName(fieldErrors.cover_alt)}
              aria-invalid={fieldErrors.cover_alt?.length > 0}
            />
          </Field>
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            onChange={event => {
              setCoverFile(event.target.files?.[0] ?? null)
              clearFieldErrors(['cover_file'])
            }}
          />
          {fieldErrors.cover_file && fieldErrors.cover_file.length > 0 && (
            <div className="space-y-1 text-xs text-rose-700">
              {fieldErrors.cover_file.map(message => (
                <p key={`cover-file-${message}`}>Fichier couverture - {message}</p>
              ))}
            </div>
          )}
          {fieldErrors.cover_photo && fieldErrors.cover_photo.length > 0 && (
            <div className="space-y-1 text-xs text-rose-700">
              {fieldErrors.cover_photo.map(message => (
                <p key={`cover-photo-${message}`}>Photo de couverture - {message}</p>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleCoverUpload}
            className={secondaryButtonClassName}
            disabled={busy !== null || !coverFile || coverAlt.trim().length < 3}
          >
            {busy === 'upload-cover' ? 'Upload…' : 'Uploader la couverture'}
          </button>
          <Field label="Alt galerie" errors={fieldErrors.gallery_alt}>
            <input
              value={galleryAlt}
              onChange={event => {
                setGalleryAlt(event.target.value)
                clearFieldErrors(['gallery_alt'])
              }}
              className={inputClassName(fieldErrors.gallery_alt)}
              aria-invalid={fieldErrors.gallery_alt?.length > 0}
            />
          </Field>
          <input
            ref={galleryFileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            onChange={event => {
              setGalleryFiles(Array.from(event.target.files ?? []))
              clearFieldErrors(['gallery_file'])
            }}
          />
          {fieldErrors.gallery_file && fieldErrors.gallery_file.length > 0 && (
            <div className="space-y-1 text-xs text-rose-700">
              {fieldErrors.gallery_file.map(message => (
                <p key={`gallery-file-${message}`}>Fichiers galerie - {message}</p>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleGalleryUpload}
            className={secondaryButtonClassName}
            disabled={busy !== null || galleryFiles.length === 0 || galleryAlt.trim().length < 3}
          >
            {busy === 'upload-gallery' ? 'Upload…' : 'Uploader la galerie'}
          </button>
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
          <p className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Vous pouvez démarrer avec le brief seul. Titre, excerpt, SEO et faits vérifiés restent optionnels tant que vous n’êtes pas en publication.
          </p>
          <Field label="Brief" errors={fieldErrors.brief}>
            <textarea value={brief} onChange={event => {
              setBrief(event.target.value)
              clearFieldErrors(['brief'])
            }} rows={5} className={textareaClassName(fieldErrors.brief)} aria-invalid={fieldErrors.brief?.length > 0} />
          </Field>
          <Field label="Faits vérifiés" errors={fieldErrors.verified_facts}>
            <textarea value={verifiedFacts} onChange={event => {
              setVerifiedFacts(event.target.value)
              clearFieldErrors(['verified_facts'])
            }} rows={7} className={textareaClassName(fieldErrors.verified_facts)} aria-invalid={fieldErrors.verified_facts?.length > 0} />
          </Field>
          <p className="text-xs text-slate-500">Optionnel. Ajoutez seulement des repères factuels déjà vérifiés si vous en avez.</p>
          <button type="button" onClick={generateDraft} className={primaryButtonClassName} disabled={busy !== null}>
            {busy === 'generate' ? 'Génération…' : article.id ? 'Générer un brouillon' : 'Créer et générer le brouillon'}
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
            <button type="button" onClick={() => setConfirmDelete(true)} className={dangerButtonClassName} disabled={busy !== null}>
              Effacer
            </button>
          </>
        )}
      </div>

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer la suppression"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => busy === null && setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">Effacer cet article ?</h2>
              <p className="text-sm text-slate-600">
                L’article « {article.title || 'Sans titre'} » sera retiré du blog et de la liste admin. Cette action est définitive depuis l’interface.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className={secondaryButtonClassName}
                disabled={busy !== null}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={deleteArticle}
                className={dangerButtonClassName}
                disabled={busy !== null}
              >
                {busy === 'delete' ? 'Suppression…' : 'Effacer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, errors }: { label: string; children: React.ReactNode; errors?: string[] }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
      {errors && errors.length > 0 && (
        <div className="space-y-1 text-xs text-rose-700">
          {errors.map(message => (
            <p key={`${label}-${message}`}>{label} - {message}</p>
          ))}
        </div>
      )}
    </label>
  )
}

function inputClassName(errors?: string[]) {
  return `w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none ring-0 ${errors && errors.length > 0 ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500' : 'border-slate-200 focus:border-[#0B1437]'}`
}

function textareaClassName(errors?: string[]) {
  return `${inputClassName(errors)} min-h-[120px]`
}

function CharacterCounter({ current, min, max }: { current: number; min: number; max: number }) {
  const isInvalid = (current > 0 && current < min) || current > max

  return (
    <p className={`text-right text-[11px] font-medium ${isInvalid ? 'text-rose-600' : 'text-slate-400'}`}>
      {current} / {max} caractères
    </p>
  )
}

function MarkdownCounter({ wordCount, characterCount }: { wordCount: number; characterCount: number }) {
  return (
    <p className="text-right text-[11px] font-medium text-slate-400">
      {wordCount} mots • {characterCount} caractères
    </p>
  )
}

const primaryButtonClassName = 'inline-flex items-center justify-center rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-semibold text-white'
const secondaryButtonClassName = 'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900'
const dangerButtonClassName = 'inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60'
