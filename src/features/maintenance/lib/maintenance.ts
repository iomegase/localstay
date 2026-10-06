// Spec 087 : règles du mode maintenance (pures).

export const DEFAULT_MAINTENANCE_MESSAGE = 'Nous améliorons MyStay. Le site revient très vite, merci de votre patience.'
export const MAINTENANCE_MESSAGE_MAX = 500
export const MAINTENANCE_PATH = '/maintenance'

export type MaintenanceState = { enabled: boolean; message: string }

export function maintenanceMessage(message: string | null | undefined): string {
  return message?.trim() || DEFAULT_MAINTENANCE_MESSAGE
}

/** Spec 087 AC-02-04 : la maintenance ne ferme que le site de production Vercel. */
export function isMaintenanceEnvironment(vercelEnv: { VERCEL_ENV?: string } = { VERCEL_ENV: process.env.VERCEL_ENV }): boolean {
  return vercelEnv.VERCEL_ENV === 'production'
}

/**
 * Spec 087 AC-02-01 / AC-02-02 : seules les pages du site public sont fermées ;
 * la connexion reste ouverte (le reste est hors du site public : /sejour, /dashboard, /admin, /api…).
 */
export function isMaintenanceBlockedPath(pathname: string, isPublicMarketingPath: boolean): boolean {
  return isPublicMarketingPath && pathname !== '/connexion'
}
