import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'

export default async function AdminNewPoiPage() {
  await getPageAdmin()
  const options = await getManualPoiFormOptions()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Saisie manuelle</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Créer un POI</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Création super-admin avec géocodage Mapbox et détection de doublon avant publication.
        </p>
      </div>

      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardContent className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" className="bg-white text-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" className="bg-white text-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city_id">Ville</Label>
            <select id="city_id" name="city_id" className="h-10 rounded-md bg-white px-3 text-sm text-slate-950">
              {options.cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_id">Catégorie</Label>
            <select id="category_id" name="category_id" className="h-10 rounded-md bg-white px-3 text-sm text-slate-950">
              {options.categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" className="bg-white text-slate-950" />
          </div>
          <div className="md:col-span-2">
            <Button type="button">Créer après validation</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
