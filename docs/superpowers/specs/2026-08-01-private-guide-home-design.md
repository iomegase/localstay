# Private Guide Home Design

## Scope

Ce premier incrément crée la nouvelle home privée canonique `/sejour`. Il ne
migre pas encore les pages enfants. Le rendu reprend la home de la démonstration
avec les vraies données du Lodging et conserve les surfaces historiques comme
destinations temporaires.

## Architecture

`/sejour/page.tsx` reste un Server Component. Il résout le séjour actif via
`getActiveLodgingContext()`, charge un modèle de présentation privé avec une
query dédiée, puis rend une fine enveloppe cliente autour des composants du
`GuideApp`.

L'interface partagée ne doit pas connaître Prisma, les cookies ou la logique QR.
Un adaptateur `private-guide-data.ts` transforme les lignes Prisma en
`GuideLodging` et `GuidePoi`. La distinction `private`/`demo` reste limitée à la
source de données, aux liens et aux fonctions sensibles.

## Navigation du premier incrément

- `/sejour` est la home canonique.
- Le QR `/guide/{city}?lodging={uuid}` pose le cookie puis redirige vers
  `/sejour?lodging={uuid}`.
- `/nos-recommandations` reste temporairement la liste historique et sert de
  destination au CTA « Explorer ». Elle deviendra un alias de compatibilité
  seulement lorsque `/sejour/coups-de-coeur` sera livré.
- `/le-logement`, `/map`, `/mes-favoris` et les routes POI restent disponibles.

## Composants

### `PrivateGuideHome`

Client Component léger qui compose `GuideHeader`, `GuideHome`,
`GuideNavigation` et `GuideMenuOverlay` avec `mode="private"`. Il reçoit des
URLs privées explicites pour les actions qui ne disposent pas encore d'une vue
`/sejour/*`.

### `GuideHome`

Le composant partagé accepte soit une navigation interne de démonstration, soit
des destinations privées. Le contenu et les classes visuelles restent communs.
Les libellés utilisent le Lodging réel et le nombre réel de recommandations.

### `GuideMenuOverlay`

Le menu reçoit des items typés. En démo, les items peuvent rester inactifs. En
privé, ils utilisent les routes existantes et conservent la fermeture clavier.

### Adaptateur serveur

La query charge en parallèle :

- la personnalisation du logement nécessaire au visuel ;
- les recommandations `LodgingFeaturedPoi` publiables ;
- les catégories, villes, coordonnées, horaires et photos des POI ;
- les informations randonnée déjà publiées quand elles sont disponibles.

Le premier incrément n'affiche pas les fiches POI dans `/sejour`, mais produit
déjà un `GuidePoi[]` compatible afin que les incréments suivants réutilisent la
même frontière de données.

## Data Flow

```text
QR ou lien privé
  → proxy valide l'UUID et pose lodging_id
  → /sejour Server Component
  → getActiveLodgingContext()
  → getPrivateGuideData(lodgingId)
  → adaptateurs GuideLodging + GuidePoi[]
  → PrivateGuideHome
  → composants GuideApp partagés
```

## Security and Failure States

- Sans cookie valide, le proxy conserve l'écran `acces-reserve`.
- Aucune donnée privée n'est chargée par le bundle de démonstration.
- Aucun mot de passe Wi-Fi ou code d'accès n'est inventé.
- Aucun GPS n'est lancé avant une action explicite.
- Une erreur de données ne doit pas exposer Prisma, Supabase ou un UUID dans
  l'interface.

## Testing

Le développement suit TDD :

1. test de contrat de l'adaptateur privé ;
2. test d'intégration de `/sejour` avec cookie et données réelles mockées ;
3. test de l'absence de données démo ;
4. test du QR vers `/sejour` ;
5. test de compatibilité de l'ancien lien ;
6. test responsive sans débordement horizontal ;
7. non-régression des routes privées historiques et de `/start`.

## Delivery Boundary

La livraison est complète lorsque `/sejour` est utilisable comme home privée et
que le QR y conduit. Les enfants de la nouvelle hiérarchie feront chacun l'objet
d'un incrément séparé réutilisant le même adaptateur et les mêmes composants.
