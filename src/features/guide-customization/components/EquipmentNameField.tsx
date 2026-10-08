'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { equipmentTitleKey } from '@/features/equipment-library/lib/title-key'
import type { EquipmentTemplate } from '@/features/equipment-library/types'

interface Props {
  id: string
  value: string
  /** Équipements validés proposables pour cette ligne (déjà privés de ceux du logement). */
  options: EquipmentTemplate[]
  error?: string
  onChange: (title: string) => void
  onPick: (template: EquipmentTemplate) => void
}

/**
 * Spec 095 AC-04-03 : nom de l'équipement en liste déroulante avec recherche ; la saisie libre
 * reste possible. Sans bibliothèque, simple champ texte.
 */
export function EquipmentNameField({ id, value, options, error, onChange, onPick }: Props) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const query = equipmentTitleKey(value)
  const matches = (query ? options.filter(option => equipmentTitleKey(option.title).includes(query)) : options)
    .toSorted((a, b) => a.title.localeCompare(b.title, 'fr'))

  const inputProps = {
    id,
    value,
    maxLength: 120,
    autoComplete: 'off',
    placeholder: 'Ex. Machine à café, Télévision, Lave-linge…',
    'aria-invalid': error ? true : undefined,
    'data-field-error': error ? '' : undefined,
    className: error ? 'border-rose-400 focus-visible:ring-rose-400' : undefined,
  }

  if (options.length === 0) {
    return <Input {...inputProps} onChange={event => onChange(event.target.value)} />
  }

  function pick(template: EquipmentTemplate) {
    onPick(template)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive(current => (matches.length === 0 ? -1 : (current + step + matches.length) % matches.length))
    } else if (event.key === 'Enter' && open && active >= 0 && matches[active]) {
      event.preventDefault()
      pick(matches[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const expanded = open && matches.length > 0

  return (
    <div className="relative">
      <Input
        {...inputProps}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        className={`pr-10 ${inputProps.className ?? ''}`}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onChange={event => {
          onChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Afficher les équipements de la bibliothèque"
        onMouseDown={event => {
          event.preventDefault()
          setOpen(current => !current)
        }}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {matches.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mouseDown (et non click) : choisi avant le blur qui ferme la liste.
              onMouseDown={event => {
                event.preventDefault()
                pick(option)
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-charcoal ${
                index === active ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <CategoryIcon iconSlug={option.icon} className="h-4 w-4 shrink-0 text-gray-500" />
              {option.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
