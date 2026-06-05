'use client'

import { useState } from 'react'
import { Eye, Mail, Phone } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { OwnerContactMessageRow } from '../types'

type OwnerContactMessagesPanelProps = {
  messages: OwnerContactMessageRow[]
}

const STATUS_LABELS = {
  new: 'Nouveau',
  replied: 'Répondu',
  archived: 'Archivé',
} as const

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(value))
}

export function OwnerContactMessagesPanel({ messages }: OwnerContactMessagesPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = messages.find((message) => message.id === selectedId) ?? null

  return (
    <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Messages voyageurs</p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Demandes propriétaires</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
          Les messages envoyés depuis la page Contact avec la destination Propriétaire apparaissent ici. Le Super-admin conserve aussi une copie globale.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="m-6 flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          <p className="text-sm text-gray-500">Aucun message propriétaire pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="hidden text-gray-400 md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest">Logement</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Voyageur</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Message</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Statut</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {messages.map((message) => (
                <tr key={message.id} className="flex flex-col gap-2 px-6 py-5 md:table-row md:px-0 md:py-0">
                  <td className="font-semibold text-neutral-900 md:px-6 md:py-4">{message.lodging_name}</td>
                  <td className="text-gray-500 md:px-4 md:py-4">{formatDate(message.created_at)}</td>
                  <td className="text-gray-700 md:px-4 md:py-4">
                    <p className="font-medium text-gray-900">{message.sender_name}</p>
                    <p className="mt-1 text-xs text-gray-500">{message.sender_email}</p>
                  </td>
                  <td className="max-w-md text-gray-700 md:px-4 md:py-4">
                    <p className="font-medium text-gray-900">{message.subject}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{message.message}</p>
                  </td>
                  <td className="md:px-4 md:py-4">
                    <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {STATUS_LABELS[message.status]}
                    </span>
                  </td>
                  <td className="flex gap-2 md:justify-end md:px-6 md:py-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Voir le message"
                      onClick={() => setSelectedId(message.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selected && (
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[25px] border-none bg-white p-6 shadow-xl sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message de {selected.sender_name}</DialogTitle>
              <DialogDescription>
                {selected.lodging_name} · {formatDate(selected.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">{selected.subject}</p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-600">{selected.message}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {selected.sender_email}
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {selected.sender_phone ?? 'Non renseigné'}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
