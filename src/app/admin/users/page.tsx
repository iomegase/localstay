import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminUsers, type AdminUserRole } from '@/features/admin/queries/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

type AdminUsersPageProps = {
  searchParams?: Promise<{ role?: string }>
}

const ROLE_FILTERS: Array<{ label: string; href: string }> = [
  { label: 'Tous', href: '/admin/users' },
  { label: 'Owners', href: '/admin/users?role=owner' },
  { label: 'Merchants', href: '/admin/users?role=merchant' },
  { label: 'Admins', href: '/admin/users?role=admin' },
]

function parseRole(role?: string): AdminUserRole | undefined {
  if (role === 'owner' || role === 'merchant' || role === 'admin') return role
  return undefined
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps = {}) {
  await getPageAdmin()
  const params = searchParams ? await searchParams : {}
  const role = parseRole(params.role)
  const users = await getAdminUsers(role)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Utilisateurs</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Comptes actifs</h1>
        <p className="mt-2 text-sm text-slate-400">Consultation uniquement : pas de désactivation, changement de rôle ou impersonation.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map(filter => (
          <Link key={filter.href} href={filter.href} className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200 hover:bg-white/10">
            {filter.label}
          </Link>
        ))}
      </div>

      <Card className="bg-white text-slate-950">
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Subscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.is_active ? 'Actif' : 'Inactif'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{user.subscription_status ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
