'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { ImageUpload } from '@/shared/components/ImageUpload'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import {
  PRACTICAL_BLOCK_ICONS,
  DEFAULT_PRACTICAL_BLOCK_ICON,
} from '@/features/guide-customization/lib/practical-block-icons'
import type { PracticalBlockInput } from '@/features/guide-customization/types'

interface Props {
  value: PracticalBlockInput[]
  onChange: (next: PracticalBlockInput[]) => void
  lodgingId: string
}

export function PracticalBlocksEditor({ value, onChange, lodgingId }: Props) {
  function addBlock() {
    onChange([
      ...value,
      { title: '', body: null, icon: DEFAULT_PRACTICAL_BLOCK_ICON, photo_url: null, sort_order: value.length },
    ])
  }

  function updateBlock(index: number, patch: Partial<PracticalBlockInput>) {
    onChange(value.map((block, i) => (i === index ? { ...block, ...patch } : block)))
  }

  function removeBlock(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Blocs personnalisés</h3>
          <p className="text-xs text-gray-500">Ajoutez vos propres rubriques (titre, texte, photo).</p>
        </div>
        <button
          type="button"
          onClick={addBlock}
          className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
        </button>
      </div>

      {value.map((block, index) => (
        <div key={index} className="space-y-3 rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`block-title-${index}`} className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Titre du bloc
            </Label>
            <button
              type="button"
              onClick={() => removeBlock(index)}
              aria-label="Supprimer le bloc"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-red-300 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
          </div>

          <Input
            id={`block-title-${index}`}
            value={block.title}
            maxLength={120}
            placeholder="Ex. La plage, Les commerces, Bons plans…"
            onChange={event => updateBlock(index, { title: event.target.value })}
          />

          <div>
            <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Icône</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRACTICAL_BLOCK_ICONS.map(icon => {
                const selected = block.icon === icon.slug
                return (
                  <button
                    key={icon.slug}
                    type="button"
                    aria-label={icon.label}
                    aria-pressed={selected}
                    title={icon.label}
                    onClick={() => updateBlock(index, { icon: icon.slug })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      selected ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-charcoal'
                    }`}
                  >
                    <CategoryIcon iconSlug={icon.slug} className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor={`block-body-${index}`} className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Texte
            </Label>
            <Textarea
              id={`block-body-${index}`}
              value={block.body ?? ''}
              rows={4}
              onChange={event => updateBlock(index, { body: event.target.value })}
            />
            <MarkdownHint />
          </div>

          <div className="space-y-2">
            <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Photo (optionnelle)</Label>
            <ImageUpload
              endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
              onUploaded={url => updateBlock(index, { photo_url: url })}
              label="Téléverser une photo"
            />
            {block.photo_url && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.photo_url} alt="Aperçu du bloc" className="h-16 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => updateBlock(index, { photo_url: null })}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500"
                >
                  Retirer la photo
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
