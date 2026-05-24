import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminCities } from '@/features/admin/queries/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  needs_enrichment: 'À enrichir',
}

export default async function AdminCitiesPage() {
  await getPageAdmin()
  const cities = await getAdminCities()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Villes</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Villes référencées</h1>
        <p className="mt-2 text-sm text-slate-400">Consultation uniquement : aucune création ni refresh Gemini dans 016.</p>
      </div>

      <Card className="bg-white text-slate-950">
        <CardHeader>
          <CardTitle>État des villes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ville</TableHead>
                <TableHead>CP</TableHead>
                <TableHead>POI actifs</TableHead>
                <TableHead>Logements actifs</TableHead>
                <TableHead>Scans QR 30j</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Guide</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map(city => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.postal_code}</TableCell>
                  <TableCell>{city.active_poi_count}</TableCell>
                  <TableCell>{city.active_lodging_count}</TableCell>
                  <TableCell>{city.qr_scans_30d}</TableCell>
                  <TableCell>{STATUS_LABELS[city.status_label]}</TableCell>
                  <TableCell>
                    <Link href={`/guide/${city.slug}`} className="text-sm font-medium underline">
                      Voir le guide
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
