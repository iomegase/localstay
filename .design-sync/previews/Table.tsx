import { Badge, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@mystay/design-system'

const rows = [
  { name: 'Le 305', city: 'Saint-Gervais-les-Bains', scans: 248, status: 'Publié' },
  { name: 'Chalet Hygge', city: 'Saint-Gervais-les-Bains', scans: 131, status: 'Publié' },
  { name: 'La Pieuca', city: 'Les Contamines-Montjoie', scans: 0, status: 'Brouillon' },
]

export const Lodgings = () => (
  <Table className="w-[560px]">
    <TableCaption>Vos logements et leurs scans du mois.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Logement</TableHead>
        <TableHead>Ville</TableHead>
        <TableHead className="text-right">Scans</TableHead>
        <TableHead>Statut</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(row => (
        <TableRow key={row.name}>
          <TableCell className="font-medium">{row.name}</TableCell>
          <TableCell>{row.city}</TableCell>
          <TableCell className="text-right">{row.scans}</TableCell>
          <TableCell><Badge variant={row.status === 'Publié' ? 'default' : 'secondary'}>{row.status}</Badge></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
