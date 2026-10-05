'use client'

import { useState } from 'react'
import { ContactDialogFrame } from './ContactDialogFrame'
import { OwnerLeadForm } from './OwnerLeadForm'

/**
 * Formulaire propriétaire en modale (amendement 028 du 2026-10-05) : reprend
 * le formulaire « Confier mon logement » existant (source `owner_lead`).
 */
export function OwnerLeadDialog({
  label = 'Confier mon logement',
  className,
}: {
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <ContactDialogFrame
      open={open}
      onOpenChange={setOpen}
      eyebrow="Propriétaires"
      title="Confier mon logement"
      description="Vous possédez un logement dans le Pays du Mont-Blanc ? Parlez-nous de votre projet, nous vous recontactons personnellement."
      trigger={<button type="button" className={className}>{label}</button>}
    >
      <OwnerLeadForm />
    </ContactDialogFrame>
  )
}
