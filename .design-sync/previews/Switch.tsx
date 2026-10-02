import { Label, Switch } from '@mystay/design-system'

export const States = () => (
  <div className="grid gap-4">
    <div className="flex items-center gap-3"><Switch id="on" defaultChecked /><Label htmlFor="on">Page locale active</Label></div>
    <div className="flex items-center gap-3"><Switch id="off" /><Label htmlFor="off">Page locale archivée</Label></div>
    <div className="flex items-center gap-3"><Switch id="dis" disabled defaultChecked /><Label htmlFor="dis">Publication en cours…</Label></div>
  </div>
)
