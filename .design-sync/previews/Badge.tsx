import { Badge } from '@mystay/design-system'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>Publié</Badge>
    <Badge variant="secondary">Brouillon</Badge>
    <Badge variant="outline">En attente de modération</Badge>
    <Badge variant="destructive">Refusé</Badge>
  </div>
)

export const InContext = () => (
  <div className="flex items-center gap-3 text-sm">
    <span className="font-semibold">Chalet Hygge</span>
    <Badge variant="secondary">Saint-Gervais-les-Bains</Badge>
    <Badge>6 voyageurs</Badge>
  </div>
)
