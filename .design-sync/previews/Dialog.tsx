import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@mystay/design-system'

export const EditCity = () => (
  <Dialog defaultOpen>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Modifier la ville</DialogTitle>
        <DialogDescription>Corrigez les informations de Saint-Gervais. Les liens et QR codes existants sont conservés.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="name">Nom</Label><Input id="name" defaultValue="Saint-Gervais-les-Bains" /></div>
        <div className="grid gap-2"><Label htmlFor="cp">Code postal</Label><Input id="cp" defaultValue="74170" /></div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline">Annuler</Button>
        <Button>Enregistrer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
