import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@mystay/design-system'

export const StatCard = () => (
  <Card className="w-[280px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">Scans du QR code</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">248</p>
      <p className="text-xs text-muted-foreground">+18 % sur les 30 derniers jours</p>
    </CardContent>
  </Card>
)

export const WithFooter = () => (
  <Card className="w-[360px]">
    <CardHeader>
      <CardTitle>Le 305</CardTitle>
      <CardDescription>Appartement · Saint-Gervais-les-Bains · 4 voyageurs</CardDescription>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      Guide publié. Les voyageurs y accèdent en scannant le QR code de l'entrée.
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Personnaliser</Button>
      <Button size="sm" variant="outline">Voir le guide</Button>
    </CardFooter>
  </Card>
)
