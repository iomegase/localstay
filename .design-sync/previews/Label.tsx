import { Input, Label, Switch } from '@mystay/design-system'

export const ForInput = () => (
  <div className="grid w-[300px] gap-2">
    <Label htmlFor="city">Ville</Label>
    <Input id="city" defaultValue="Saint-Gervais-les-Bains" />
  </div>
)

export const ForSwitch = () => (
  <div className="flex items-center gap-3">
    <Switch id="publish" defaultChecked />
    <Label htmlFor="publish">Publier le guide</Label>
  </div>
)
