import { Separator } from '@mystay/design-system'

export const Horizontal = () => (
  <div className="w-[320px] text-sm">
    <p className="font-semibold">Le 305</p>
    <p className="text-muted-foreground">Appartement · 4 voyageurs</p>
    <Separator className="my-3" />
    <p className="text-muted-foreground">Arrivée dès 16 h · Départ avant 10 h</p>
  </div>
)

export const Vertical = () => (
  <div className="flex h-6 items-center gap-3 text-sm">
    <span>Séjour</span>
    <Separator orientation="vertical" />
    <span>Guide</span>
    <Separator orientation="vertical" />
    <span>Aide</span>
  </div>
)
