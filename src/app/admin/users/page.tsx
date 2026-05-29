import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminUsers, type AdminUserRole } from '@/features/admin/queries/dashboard'
import { User, Shield, Store, CheckCircle2, XCircle } from 'lucide-react'

type AdminUsersPageProps = {
  searchParams?: Promise<{ role?: string }>
}

const ROLE_FILTERS: Array<{ label: string; href: string; roleValue: string | undefined }> = [
  { label: 'Tous', href: '/admin/users', roleValue: undefined },
  { label: 'Owners', href: '/admin/users?role=owner', roleValue: 'owner' },
  { label: 'Merchants', href: '/admin/users?role=merchant', roleValue: 'merchant' },
  { label: 'Admins', href: '/admin/users?role=admin', roleValue: 'admin' },
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
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      {/* Header Section */}
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Utilisateurs
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Comptes actifs
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Consultation uniquement : pas de désactivation, changement de rôle ou impersonation.
          </p>
        </div>
      </header>

      {/* Filters (Pills) */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map(filter => {
          const isActive = role === filter.roleValue
          return (
            <Link 
              key={filter.href} 
              href={filter.href} 
              className={`rounded-xl px-5 py-2.5 text-[12px] font-bold transition-all duration-300 ${
                isActive 
                  ? 'bg-[#0B1437] text-white shadow-md' 
                  : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      {/* Table Section */}
      <div className="w-full overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-base font-bold text-neutral-900">Liste des utilisateurs</h2>
        </div>
        
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
            <p className="text-sm font-medium text-gray-500">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Utilisateur (Email)</th>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Rôle</th>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Abonnement</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Date de création</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80 bg-white">
                {users.map(user => (
                  <tr key={user.id} className="group transition-colors duration-200 hover:bg-gray-50/50">
                    
                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F7FE] text-[#0B1437]">
                          <User size={14} strokeWidth={2.5} />
                        </div>
                        <span className="text-[13px] font-bold text-neutral-900">{user.email}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.is_active ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <XCircle size={14} className="text-gray-400" />
                        )}
                        <span className={`text-[12px] font-bold ${user.is_active ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>

                    {/* Subscription */}
                    <td className="px-6 py-4">
                      {user.subscription_status ? (
                        <span className="inline-flex items-center rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {user.subscription_status}
                        </span>
                      ) : (
                        <span className="text-[12px] font-semibold text-gray-400">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-semibold text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* Helper pour les badges de rôles */
function RoleBadge({ role }: { role: string }) {
  let style = 'bg-gray-100/80 text-gray-500 border-gray-200/50'
  let Icon = User

  if (role === 'admin') {
    style = 'bg-rose-50 text-rose-600 border-rose-100/50'
    Icon = Shield
  } else if (role === 'owner') {
    style = 'bg-blue-50 text-blue-600 border-blue-100/50'
    Icon = CheckCircle2
  } else if (role === 'merchant') {
    style = 'bg-amber-50 text-amber-600 border-amber-100/50'
    Icon = Store
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${style}`}>
      <Icon size={10} strokeWidth={2.5} />
      {role}
    </span>
  )
}