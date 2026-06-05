'use client'

import { useMemo, useState } from 'react'
import { Archive, Eye, Send, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import type { AdminContactMessageRow } from '../types'

type Tab = 'active' | 'archived'

type AdminContactMessagesPanelProps = {
  messages: AdminContactMessageRow[]
}

const DESTINATION_LABELS = {
  owner: 'Propriétaire',
  concierge: 'Conciergerie',
} as const

const STATUS_LABELS = {
  new: 'Nouveau',
  replied: 'Répondu',
  archived: 'Archivé',
} as const

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(value))
}

export function AdminContactMessagesPanel({ messages }: AdminContactMessagesPanelProps) {
  const [rows, setRows] = useState(messages)
  const [tab, setTab] = useState<Tab>('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const selected = rows.find((row) => row.id === selectedId) ?? null
  const visibleRows = useMemo(() => {
    return rows.filter((row) => (tab === 'archived' ? row.archived_at !== null : row.archived_at === null))
  }, [rows, tab])

  function openMessage(message: AdminContactMessageRow) {
    setSelectedId(message.id)
    setReplyBody(message.reply_body ?? '')
    setNotice(null)
  }

  async function archiveMessage(id: string) {
    setBusy(true)
    setNotice(null)
    const response = await fetch(`/api/admin/contact-messages/${id}`, { method: 'DELETE' })
    setBusy(false)
    if (!response.ok) {
      setNotice('Archivage impossible.')
      return
    }
    const archivedAt = new Date().toISOString()
    setRows((current) => current.map((row) => (
      row.id === id ? { ...row, status: 'archived', archived_at: archivedAt } : row
    )))
    setNotice('Message archivé.')
  }

  async function replyToMessage() {
    if (!selected || replyBody.trim().length === 0) return
    setBusy(true)
    setNotice(null)
    const response = await fetch(`/api/admin/contact-messages/${selected.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply_body: replyBody }),
    })
    setBusy(false)
    if (!response.ok) {
      setNotice('Réponse impossible.')
      return
    }
    const payload = await response.json() as { email_sent: boolean }
    const repliedAt = new Date().toISOString()
    setRows((current) => current.map((row) => (
      row.id === selected.id
        ? { ...row, status: 'replied', reply_body: replyBody, replied_at: repliedAt }
        : row
    )))
    setNotice(payload.email_sent ? 'Réponse envoyée par email.' : 'Réponse sauvegardée sans envoi email.')
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Messages voyageurs</p>
          <h2 className="mt-1 text-base font-bold text-gray-900">Inbox contact globale</h2>
        </div>
        <div className="inline-flex rounded-xl border border-gray-100 bg-gray-50 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`rounded-lg px-4 py-2 ${tab === 'active' ? 'bg-[#111A2C] text-white shadow-sm' : 'text-gray-500'}`}
          >
            Actifs
          </button>
          <button
            type="button"
            onClick={() => setTab('archived')}
            className={`rounded-lg px-4 py-2 ${tab === 'archived' ? 'bg-[#111A2C] text-white shadow-sm' : 'text-gray-500'}`}
          >
            Archivés
          </button>
        </div>
      </div>

      {notice && <p className="mx-6 mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">{notice}</p>}

      {visibleRows.length === 0 ? (
        <div className="m-6 flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          <p className="text-sm text-gray-500">Aucun message dans cet onglet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="hidden text-gray-400 md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest">Logement</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Destination</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Sujet</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest">Statut</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleRows.map((message) => (
                <tr key={message.id} className="flex flex-col gap-2 px-6 py-5 md:table-row md:px-0 md:py-0">
                  <td className="font-semibold text-neutral-900 md:px-6 md:py-4">{message.lodging_name}</td>
                  <td className="text-gray-600 md:px-4 md:py-4">{DESTINATION_LABELS[message.destination]}</td>
                  <td className="text-gray-500 md:px-4 md:py-4">{formatDate(message.created_at)}</td>
                  <td className="text-gray-700 md:px-4 md:py-4">{message.subject}</td>
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
                      onClick={() => openMessage(message)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Archiver le message"
                      disabled={busy || message.archived_at !== null}
                      onClick={() => void archiveMessage(message.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
                {selected.lodging_name} · {DESTINATION_LABELS[selected.destination]} · {formatDate(selected.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">{selected.subject}</p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-600">{selected.message}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <p><span className="font-semibold text-gray-900">Email :</span> {selected.sender_email}</p>
                <p><span className="font-semibold text-gray-900">Téléphone :</span> {selected.sender_phone ?? 'Non renseigné'}</p>
              </div>
              {selected.archived_at && (
                <p className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                  <Archive className="h-4 w-4" />
                  Archivé le {formatDate(selected.archived_at)}
                </p>
              )}
              <div>
                <Label htmlFor="contact-message-reply">Réponse</Label>
                <Textarea
                  id="contact-message-reply"
                  className="mt-2 min-h-32"
                  maxLength={2000}
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>
                Fermer
              </Button>
              <Button type="button" disabled={busy || replyBody.trim().length === 0} onClick={() => void replyToMessage()}>
                <Send className="h-4 w-4" />
                Envoyer la réponse
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
