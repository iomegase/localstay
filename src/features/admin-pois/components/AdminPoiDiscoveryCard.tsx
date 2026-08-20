'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import type {
  AdminPoiDiscoveryEligibility,
  AdminPoiDiscoveryStatus,
} from '@/features/admin-pois/types'

type AdminPoiDiscoveryCardProps = {
  poiId: string
  status: AdminPoiDiscoveryStatus
  publishedAt: string | null
  publicUrl: string | null
  eligibility: AdminPoiDiscoveryEligibility
}

const CHECK_LABELS: Array<{
  key: keyof AdminPoiDiscoveryEligibility['checks']
  label: string
}> = [
  { key: 'active', label: 'POI actif' },
  { key: 'city', label: 'Ville active' },
  { key: 'category', label: 'Catégorie active' },
  { key: 'subcategory', label: 'Sous-catégorie active (si renseignée)' },
  { key: 'description', label: 'Description' },
  { key: 'photo', label: 'Photo exploitable' },
  { key: 'address', label: 'Adresse' },
  { key: 'geocode', label: 'Géocodage' },
  { key: 'contact', label: 'Contact' },
]

const GENERIC_ERROR = 'La mise à jour de la publication a échoué. Veuillez réessayer.'

export function AdminPoiDiscoveryCard({
  poiId,
  status,
  publishedAt,
  publicUrl,
  eligibility,
}: AdminPoiDiscoveryCardProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isPublished = status === 'PUBLISHED'
  const actionLabel = isPublished ? 'Retirer de Découvrir' : 'Publier dans Découvrir'
  const pendingLabel = isPublished ? 'Retrait en cours…' : 'Publication en cours…'

  async function updatePublication() {
    if (pending) return

    const confirmed = window.confirm(
      isPublished
        ? 'Confirmer le retrait de ce POI de Découvrir ?'
        : 'Confirmer la publication de ce POI dans Découvrir ?',
    )
    if (!confirmed) return

    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/pois/${poiId}/discovery-publication`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isPublished ? 'DRAFT' : 'PUBLISHED' }),
      })
      const payload: unknown = await response.json()

      if (!response.ok) {
        setError(readApiErrorMessage(payload) ?? GENERIC_ERROR)
        return
      }

      if (!hasDataObject(payload)) {
        setError(GENERIC_ERROR)
        return
      }

      router.refresh()
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <h2 className="text-lg font-bold text-slate-900">Découverte publique</h2>
          </CardTitle>
          <Badge
            data-slot="badge"
            variant="outline"
            className={isPublished
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'}
          >
            {isPublished ? 'Publié' : 'Brouillon'}
          </Badge>
        </div>
        <CardDescription>
          Contrôlez l’éligibilité éditoriale avant d’exposer ce POI sur Découvrir.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {publishedAt && (
          <p className="text-sm text-slate-600">
            Publié le <span className="font-semibold text-slate-800">{formatPublishedAt(publishedAt)}</span>
          </p>
        )}

        {publicUrl && (
          <Button asChild variant="outline" size="sm">
            <Link href={publicUrl}>
              Voir la fiche publique
              <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
        )}

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Complétude BR-04
          </p>
          <ul aria-label="Checklist de publication" className="space-y-2">
            {CHECK_LABELS.map(({ key, label }) => {
              const satisfied = eligibility.checks[key]
              return (
                <li
                  key={key}
                  aria-label={`${label} : ${satisfied ? 'satisfait' : 'manquant'}`}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  {satisfied ? (
                    <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle aria-hidden="true" className="size-4 shrink-0 text-rose-600" />
                  )}
                  <span>{label}</span>
                  <span className="sr-only">{satisfied ? 'satisfait' : 'manquant'}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          type="button"
          variant={isPublished ? 'outline' : 'default'}
          className="w-full"
          disabled={pending || (!isPublished && !eligibility.eligible)}
          aria-label={pending ? pendingLabel : actionLabel}
          aria-busy={pending}
          onClick={updatePublication}
        >
          {pending ? pendingLabel : actionLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

function formatPublishedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'date indisponible'

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date)
}

function hasDataObject(value: unknown): boolean {
  return isRecord(value) && isRecord(value.data)
}

function readApiErrorMessage(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.error)) return null
  return typeof value.error.message === 'string' && value.error.message.trim().length > 0
    ? value.error.message
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
