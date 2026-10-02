import { Label, Textarea } from '@mystay/design-system'

export const WithLabel = () => (
  <div className="grid w-[360px] gap-2">
    <Label htmlFor="welcome">Message d'accueil</Label>
    <Textarea id="welcome" rows={4} defaultValue="Bienvenue au 305 ! Les clés sont dans la boîte à clés à droite de la porte d'entrée. Bon séjour à Saint-Gervais." />
  </div>
)

export const Placeholder = () => (
  <div className="grid w-[360px] gap-2">
    <Label htmlFor="rules">Règlement intérieur</Label>
    <Textarea id="rules" rows={3} placeholder="Ex. Logement non-fumeur, calme après 22 h." />
  </div>
)
