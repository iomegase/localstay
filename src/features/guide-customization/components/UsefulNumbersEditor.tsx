'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import {
  USEFUL_NUMBER_CATEGORIES,
  parseUsefulNumbers,
  serializeUsefulNumbers,
  type UsefulNumberRow,
} from '@/features/guide-customization/lib/useful-numbers'

export function UsefulNumbersEditor({
  value,
  onChange,
}: {
  value: string | null | undefined
  onChange: (serialized: string) => void
}) {
  const [rows, setRows] = useState<UsefulNumberRow[]>(() =>
    parseUsefulNumbers(value),
  )

  function commit(next: UsefulNumberRow[]) {
    setRows(next)
    onChange(serializeUsefulNumbers(next))
  }

  function updateRow(index: number, patch: Partial<UsefulNumberRow>) {
    commit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    commit([...rows, { category: 'tourisme', customLabel: '', phone: '' }])
  }

  function removeRow(index: number) {
    commit(rows.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 pt-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Numéros utiles
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          Contacts locaux affichés au voyageur. Les numéros d&apos;urgence (112,
          15, 18…) sont déjà fournis automatiquement.
        </p>
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-gray-400">Aucun numéro pour l&apos;instant.</p>
      )}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-3"
          >
            <select
              aria-label="Catégorie"
              value={row.category}
              onChange={event => updateRow(index, { category: event.target.value })}
              className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1437]/20"
            >
              {USEFUL_NUMBER_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            {row.category === 'autre' && (
              <Input
                aria-label="Libellé personnalisé"
                value={row.customLabel}
                maxLength={60}
                placeholder="Ex. Boulangerie"
                onChange={event =>
                  updateRow(index, { customLabel: event.target.value })
                }
                className="h-10 min-w-[140px] flex-1 rounded-lg border border-gray-200 bg-white px-2 text-sm"
              />
            )}

            <Input
              aria-label="Téléphone"
              value={row.phone}
              inputMode="tel"
              maxLength={30}
              placeholder="04 50 00 00 00"
              onChange={event => updateRow(index, { phone: event.target.value })}
              className="h-10 min-w-[140px] flex-1 rounded-lg border border-gray-200 bg-white px-2 text-sm"
            />

            <button
              type="button"
              aria-label="Supprimer"
              onClick={() => removeRow(index)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F7FE] px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0B1437] transition-colors hover:bg-[#0B1437] hover:text-white"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter un numéro
      </button>
    </div>
  )
}
