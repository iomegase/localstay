// src/shared/types/roles.ts
export type Role = 'tourist' | 'owner' | 'merchant' | 'admin'

export const DASHBOARD_ROUTES: Record<Exclude<Role, 'tourist'>, string> = {
  owner: '/dashboard',
  merchant: '/merchant',
  admin: '/admin',
}
