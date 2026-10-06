import type { ReactNode } from 'react'

// Spec 068 : la fiche POI s'ouvre dans le slot @panel par-dessus la liste.
export default function AdminPoisLayout({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  return (
    <>
      {children}
      {panel}
    </>
  )
}
