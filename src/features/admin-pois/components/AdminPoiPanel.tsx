'use client'

import { type KeyboardEvent, type ReactNode, useCallback, useMemo, useRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PanelNeighbors } from '../lib/list-filters'
import { PoiEditPanelContext } from './PoiEditPanelContext'

const DISCARD_MESSAGE = 'Abandonner les modifications non enregistrées ?'

type AdminPoiPanelProps = {
  title: string
  header: ReactNode
  neighbors: PanelNeighbors | null
  sections: Array<{ id: string; label: string }>
  children: ReactNode
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Spec 068 : fiche POI dans un panneau latéral par-dessus la liste. Fermer revient à
 * l'entrée d'historique de la liste (filtres et défilement intacts) ; Précédent /
 * Suivant remplacent l'URL sans empiler l'historique.
 */
export function AdminPoiPanel({ title, header, neighbors, sections, children }: AdminPoiPanelProps) {
  const router = useRouter()
  const dirtyRef = useRef(false)

  const markDirty = useCallback(() => {
    dirtyRef.current = true
  }, [])
  const markSaved = useCallback(() => {
    dirtyRef.current = false
  }, [])
  const panelState = useMemo(() => ({ markDirty, markSaved }), [markDirty, markSaved])

  function canLeave(): boolean {
    return !dirtyRef.current || window.confirm(DISCARD_MESSAGE)
  }

  function close() {
    if (canLeave()) router.back()
  }

  function goTo(href: string | null) {
    if (!href || !canLeave()) return
    dirtyRef.current = false
    router.replace(href, { scroll: false })
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!event.altKey || isEditableTarget(event.target)) return
    if (event.key === 'ArrowRight') goTo(neighbors?.nextHref ?? null)
    if (event.key === 'ArrowLeft') goTo(neighbors?.previousHref ?? null)
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <DialogPrimitive.Root open onOpenChange={open => { if (!open) close() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          onInputCapture={markDirty}
          onChangeCapture={markDirty}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-slate-50 shadow-2xl outline-none lg:max-w-[760px]"
        >
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white">
            <div className="flex items-start justify-between gap-4 px-5 pt-4">
              <div className="min-w-0">
                <DialogPrimitive.Title className="truncate text-xl font-bold text-slate-900">{title}</DialogPrimitive.Title>
                <div className="mt-2">{header}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {neighbors && (
                  <>
                    <button
                      type="button"
                      aria-label="POI précédent"
                      disabled={!neighbors.previousHref}
                      onClick={() => goTo(neighbors.previousHref)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <span className="min-w-12 text-center text-xs font-bold text-slate-500">
                      {neighbors.index} / {neighbors.total}
                    </span>
                    <button
                      type="button"
                      aria-label="POI suivant"
                      disabled={!neighbors.nextHref}
                      onClick={() => goTo(neighbors.nextHref)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronRight aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={close}
                  className="ml-1 grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>
            {sections.length > 0 && (
              <nav aria-label="Sections de la fiche" className="mt-3 flex gap-1 overflow-x-auto px-5 pb-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <PoiEditPanelContext.Provider value={panelState}>{children}</PoiEditPanelContext.Provider>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
