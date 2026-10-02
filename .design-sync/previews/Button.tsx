import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@mystay/design-system'

export const Primary = () => <Button>Enregistrer</Button>

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Publier la fiche</Button>
    <Button variant="secondary">Brouillon</Button>
    <Button variant="outline">Statistiques</Button>
    <Button variant="ghost">Annuler</Button>
    <Button variant="destructive">Supprimer</Button>
    <Button variant="link">Voir le guide</Button>
  </div>
)

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm" variant="outline">Petit</Button>
    <Button>Par défaut</Button>
    <Button size="lg">Grand</Button>
    <Button size="icon" variant="outline" aria-label="Ajouter"><Plus /></Button>
  </div>
)

export const WithIcon = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button><Download /> Télécharger le QR code</Button>
    <Button variant="destructive"><Trash2 /> Supprimer le logement</Button>
  </div>
)

export const Disabled = () => (
  <Button variant="outline" disabled>Voir — disponible après publication</Button>
)
