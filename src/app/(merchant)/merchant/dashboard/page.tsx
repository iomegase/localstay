import { redirect } from 'next/navigation'
import { getPageMerchant } from '@/features/merchant/lib/get-page-merchant'
import { getMerchantDashboardProfile, getMerchantStats, listMerchantOffers } from '@/features/merchant/queries/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'

export default async function MerchantDashboardPage() {
  const { redirect_to, merchant } = await getPageMerchant()
  if (redirect_to !== '/merchant/dashboard') redirect(redirect_to)
  const [profile, stats, offers] = await Promise.all([
    getMerchantDashboardProfile(merchant.id),
    getMerchantStats(merchant.id),
    listMerchantOffers(merchant.id),
  ])
  const activeOfferCount = offers.filter(offer => offer.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Dashboard Merchant</p>
        <h1 className="mt-2 font-serif text-4xl italic text-charcoal">{profile.poi.name}</h1>
        <p className="mt-3 text-charcoal/60">
          Gérez votre fiche publique, vos offres et vos statistiques de visibilité.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vues 30 jours</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.totals.profile_views}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offres actives</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{activeOfferCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compte</CardTitle>
          </CardHeader>
          <CardContent className="truncate text-sm">{merchant.email}</CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild><a href="/merchant/profile">Ma fiche</a></Button>
        <Button asChild variant="outline"><a href="/merchant/stats">Statistiques</a></Button>
        <Button asChild variant="outline"><a href="/merchant/offers">Offres</a></Button>
      </div>
    </div>
  )
}
