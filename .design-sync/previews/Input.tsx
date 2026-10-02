import { Input, Label } from '@mystay/design-system'

export const WithLabel = () => (
  <div className="grid w-[320px] gap-2">
    <Label htmlFor="lodging-name">Nom du logement</Label>
    <Input id="lodging-name" defaultValue="Le 305" />
  </div>
)

export const Placeholder = () => (
  <div className="grid w-[320px] gap-2">
    <Label htmlFor="wifi">Wi-Fi — nom du réseau</Label>
    <Input id="wifi" placeholder="Chalet-StGervais" />
  </div>
)

export const Disabled = () => (
  <div className="grid w-[320px] gap-2">
    <Label htmlFor="slug">Adresse publique</Label>
    <Input id="slug" defaultValue="les-hauts-de-saint-gervais" disabled />
  </div>
)
