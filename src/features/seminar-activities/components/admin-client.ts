// Spec 097 : appels admin côté navigateur, erreurs au format { error: { message } }.

export type AdminCallResult<T> = { ok: true; data: T } | { ok: false; message: string; code?: string }

export async function adminCall<T>(url: string, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', payload?: object): Promise<AdminCallResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      ...(payload ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}),
    })
    if (response.status === 204) return { ok: true, data: undefined as T }
    const json = await response.json().catch(() => null) as (T & { error?: { code?: string; message?: string } }) | null
    if (!response.ok || !json) {
      return { ok: false, message: json?.error?.message ?? 'Enregistrement impossible', code: json?.error?.code }
    }
    return { ok: true, data: json }
  } catch {
    return { ok: false, message: 'Connexion impossible, réessayez' }
  }
}
