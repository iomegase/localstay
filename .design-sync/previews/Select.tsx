import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mystay/design-system'

export const Open = () => (
  <div className="grid w-[300px] gap-2">
    <Label htmlFor="city">Ville du logement</Label>
    <Select defaultValue="saint-gervais" defaultOpen>
      <SelectTrigger id="city"><SelectValue placeholder="Choisir une ville" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="saint-gervais">Saint-Gervais-les-Bains</SelectItem>
        <SelectItem value="contamines">Les Contamines-Montjoie</SelectItem>
        <SelectItem value="chamonix">Chamonix-Mont-Blanc</SelectItem>
        <SelectItem value="megeve">Megève</SelectItem>
      </SelectContent>
    </Select>
  </div>
)
