# Spec — 048 Admin Local Landing Management

## Metadata

```yaml
id: 048-admin-local-landing-management
title: "Administration et publication des landing pages locales"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-09-08
updated_at: 2026-09-08
depends_on:
  - 016-dashboard-superadmin
  - 046-local-seo-city-cluster
  - 047-admin-local-landing-reviews
bounded_context: local-seo
implementation_gate: "Architecture, interface, règles d'activation, archivage et suppression validés par le Product Owner le 2026-09-08"
```

## Context

Les contenus des landings locales sont actuellement définis dans des constantes
TypeScript. Leur activation, leur mise à jour ou l'ajout d'une destination exige
un déploiement. Le Super-admin doit gérer depuis un même écran les trois
intentions locales d'une ville existante : conciergerie, séminaires et locations
de vacances.

Cette spec remplace, pour la source des contenus et les règles de publication,
les règles BR-01, BR-02, BR-05, BR-06, BR-10 et BR-16 de la spec 046. Elle étend
la spec 047, dont les avis deviennent rattachés à une configuration persistée.

## Glossary References

- **City**
- **Local Landing Destination**
- **Local Landing Page**
- **Local Landing Review**
- **Lodging Public Profile**
- **Admin**
- **Soft Delete**

## User Stories

### US-01 — Lister et administrer les destinations

**As a** Admin
**I want to** consulter une ligne par ville dotée de landings
**So that** je voie immédiatement leur état de publication

#### Acceptance Criteria

- **AC-01-01**: `/admin/landing-pages` affiche un tableau responsive avec le nom
  de la ville, le statut des trois intentions, le nombre d'avis, un slider, un
  crayon et une corbeille.
- **AC-01-02**: Le statut Locations indique explicitement l'absence de logement
  public lorsqu'elle empêche la publication.
- **AC-01-03**: Une destination soft-deleted n'apparaît pas dans la liste active.

### US-02 — Ajouter une ville existante

**As a** Admin
**I want to** préparer des landings pour une City existante
**So that** je puisse rédiger ses contenus avant publication

#### Acceptance Criteria

- **AC-02-01**: Le bouton `Ajouter une ville` propose uniquement les City actives
  et non supprimées qui ne possèdent aucune destination non supprimée.
- **AC-02-02**: La création produit une destination inactive et exactement trois
  pages inactives, une par intention.
- **AC-02-03**: La création ne modifie aucun champ de la City sélectionnée.
- **AC-02-04**: Une City inconnue, inactive ou déjà configurée renvoie une erreur
  sans écriture partielle.
- **AC-02-05**: Si la seule configuration antérieure de la City est soft-deleted,
  l'ajout réinitialise cette configuration avec trois contenus vides et inactifs ;
  les anciens avis restent soft-deleted, invisibles dans l'Admin et sur le public,
  et ne peuvent pas être restaurés. L'archivage individuel d'un avis reste restaurable.

### US-03 — Éditer les trois contenus au même endroit

**As a** Admin
**I want to** ouvrir trois accordéons depuis une ville
**So that** je puisse modifier chaque landing sans déploiement

#### Acceptance Criteria

- **AC-03-01**: Le crayon déplie un formulaire contenant les accordéons
  `Conciergerie`, `Séminaires` et `Locations de vacances`.
- **AC-03-02**: Chaque accordéon édite ses metadata SEO, son H1, son contenu
  local, son CTA et ses blocs répétables applicables.
- **AC-03-03**: Un contenu valide peut être enregistré lorsque la destination est
  inactive.
- **AC-03-04**: La modification d'une destination active est publique
  immédiatement et revalide les routes, hubs et sitemap concernés.

### US-04 — Activer ou archiver une ville

**As a** Admin
**I want to** piloter les landings avec un slider global
**So that** leur publication reste cohérente

#### Acceptance Criteria

- **AC-04-01**: L'activation est refusée si les contenus obligatoires
  Conciergerie ou Séminaires sont incomplets, avec la liste des champs manquants.
- **AC-04-02**: Une activation valide publie et indexe les pages Conciergerie et
  Séminaires et les ajoute au sitemap.
- **AC-04-03**: Locations de vacances est publiée et indexée uniquement si son
  contenu obligatoire est complet et si au moins un Lodging Public Profile
  éligible est associé à la City.
- **AC-04-04**: Sans logement public éligible, Locations répond 404 et reste hors
  du sitemap même lorsque la destination est active.
- **AC-04-05**: Passer le slider sur OFF conserve tous les contenus et avis mais
  fait répondre les trois routes 404 et les retire du sitemap.

### US-05 — Supprimer les landings d'une ville

**As a** Admin
**I want to** supprimer le groupe depuis la corbeille
**So that** toutes ses surfaces SEO et tous ses avis disparaissent

#### Acceptance Criteria

- **AC-05-01**: La suppression renseigne `deleted_at` sur la destination, ses
  trois pages et tous ses avis dans une transaction unique.
- **AC-05-02**: Les trois routes répondent 404 et disparaissent immédiatement du
  sitemap, des hubs et de la liste Admin active.
- **AC-05-03**: La City, ses logements, POI, articles et guides ne sont jamais
  modifiés par cette action.
- **AC-05-04**: Aucune suppression physique n'est exécutée.

### US-06 — Migrer les destinations actuelles

**As a** Product Owner
**I want to** conserver les contenus et avis existants
**So that** la bascule vers l'administration dynamique ne provoque aucune perte

#### Acceptance Criteria

- **AC-06-01**: Saint-Gervais-les-Bains, Saint-Nicolas-de-Véroce, Megève et
  Combloux sont rattachées à leurs City existantes.
- **AC-06-02**: Les textes, FAQ, étapes et statuts actuels sont importés sans
  placeholder rendu public.
- **AC-06-03**: Les Local Landing Review existants sont rattachés à la destination
  correspondante et conservent leurs valeurs et leur état.

## Business Rules

- **BR-01**: Une Local Landing Destination référence exactement une City et une
  City ne possède au plus qu'une configuration courante.
- **BR-02**: Une destination possède exactement trois Local Landing Page, une
  pour chaque intention `CONCIERGE`, `SEMINAR`, `VACATION_RENTAL`.
- **BR-03**: Le slider `is_active` s'applique globalement aux trois intentions.
- **BR-04**: Conciergerie et Séminaires ne peuvent être activées séparément.
- **BR-05**: L'activation exige un contenu complet et valide pour Conciergerie et
  Séminaires. Aucune valeur placeholder n'est acceptée.
- **BR-06**: Locations requiert en plus au moins un Lodging Public Profile
  `published`, non soft-deleted, lié à une City et un Lodging actifs.
- **BR-07**: Une page non publiée répond 404, porte aucune canonical publique et
  reste absente du sitemap.
- **BR-08**: L'enregistrement d'un brouillon de contenu ne publie pas une
  destination inactive.
- **BR-09**: Une modification valide sur une destination active est publiée
  immédiatement.
- **BR-10**: La corbeille soft-delete la destination, ses pages et ses avis, mais
  jamais la City ni ses autres relations.
- **BR-11**: Le slider OFF archive sans modifier `deleted_at` et permet une
  réactivation ultérieure.
- **BR-12**: L'ajout sélectionne uniquement une City existante ; il ne crée ni ne
  modifie une City.
- **BR-13**: Les champs et blocs sont validés selon l'intention avec Zod avant
  écriture et avant activation.
- **BR-14**: Les pages publiques restent des Server Components et lisent la base
  comme source de vérité.
- **BR-15**: Les metadata, canonical, Open Graph, JSON-LD et sitemap ne décrivent
  que les pages réellement publiées.
- **BR-16**: Aucun prix, disponibilité, capacité, affiliation ou logement fictif
  n'est généré par les contenus administrables.
- **BR-17**: Toutes les mutations sont réservées au rôle Admin.
- **BR-18**: Aucune suppression physique n'est autorisée.
- **BR-19**: Les avis supprimés avec leur destination portent
  `deleted_with_destination = true`. Ce marqueur persiste après réinitialisation
  de la destination et exclut ces avis des lectures et de la restauration.
  L'archivage individuel conserve `deleted_with_destination = false`.

## Data Model

```prisma
enum LocalLandingIntent {
  CONCIERGE
  SEMINAR
  VACATION_RENTAL
}

model LocalLandingDestination {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  city_id   String @unique
  is_active Boolean @default(false)

  city    City               @relation(fields: [city_id], references: [id])
  pages   LocalLandingPage[]
  reviews LocalLandingReview[]
}

model LocalLandingPage {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  destination_id String
  intent         LocalLandingIntent
  seo_title      String
  meta_description String
  eyebrow        String
  h1             String
  hero_title     String
  hero_copy      String
  reassurance    String?
  section_title  String
  section_copy   String
  process_title  String?
  local_title    String
  local_copy     String
  cta_label      String
  cta_href       String
  empty_copy     String?
  highlights     Json
  steps          Json
  faq            Json

  destination LocalLandingDestination @relation(fields: [destination_id], references: [id])

  @@unique([destination_id, intent])
  @@index([destination_id, deleted_at])
}

model LocalLandingReview {
  // Champs existants conservés.
  deleted_with_destination Boolean @default(false)
  destination_id String
  destination    LocalLandingDestination @relation(fields: [destination_id], references: [id])
}
```

Tous les modèles conservent les champs existants non répétés dans le fragment.
Le modèle `City` existant reçoit la relation inverse facultative
`local_landing_destination LocalLandingDestination?`.
La migration ajoute d'abord la relation d'avis comme nullable, rattache les avis
existants, puis la rend obligatoire avant que les nouvelles queries ne soient
activées.

## API Contract

```yaml
openapi: 3.1.0
paths:
  /api/admin/landing-pages:
    get:
      responses:
        '200': { description: Destinations, états, contenus, avis et villes éligibles }
        '403': { description: Accès refusé }
    post:
      requestBody: { required: true, description: city_id d'une City existante }
      responses:
        '201': { description: Destination et trois pages inactives créées }
        '400': { description: VALIDATION_ERROR }
        '403': { description: Accès refusé }
        '409': { description: DESTINATION_ALREADY_EXISTS }
  /api/admin/landing-pages/{id}:
    patch:
      requestBody: { required: true, description: Contenus des trois intentions }
      responses:
        '200': { description: Contenus mis à jour }
        '400': { description: VALIDATION_ERROR }
        '403': { description: Accès refusé }
        '404': { description: NOT_FOUND }
    delete:
      responses:
        '200': { description: Destination, pages et avis soft-deleted }
        '403': { description: Accès refusé }
        '404': { description: NOT_FOUND }
  /api/admin/landing-pages/{id}/publication:
    patch:
      requestBody: { required: true, description: is_active boolean }
      responses:
        '200': { description: État global mis à jour }
        '400': { description: INCOMPLETE_CONTENT avec champs manquants }
        '403': { description: Accès refusé }
        '404': { description: NOT_FOUND }
```

Toutes les entrées sont validées par Zod. Toutes les erreurs suivent
`{ "error": { "code", "message", "details" } }`.

## UI Behaviour

- La page existante `/admin/landing-pages` conserve la gestion des avis et ajoute
  un tableau mobile-first des destinations.
- À partir du breakpoint desktop, les statuts et actions sont disposés en
  colonnes ; sur mobile, chaque ligne devient une carte sans débordement.
- Les actions utilisent les composants Shadcn/ui et les icônes Lucide `Pencil`
  et `Trash2`.
- Le crayon ouvre un éditeur inline sous la ligne sélectionnée.
- Les trois formulaires sont des accordéons indépendants ; un seul peut rester
  ouvert sans empêcher l'enregistrement des autres contenus.
- Le slider affiche un état en attente pendant la mutation et revient à sa
  valeur précédente si l'API refuse l'activation.
- Les champs incomplets sont annoncés visuellement et via un message accessible.
- Le bouton `Ajouter une ville` est absent ou désactivé si aucune City n'est
  éligible.
- Après suppression, la ligne disparaît de la liste active et aucun bouton de
  restauration n'est exposé par cette feature.

## Acceptance Criteria

Chaque critère AC-01-01 à AC-06-03 possède au moins un test. Les règles de
publication et suppression sont couvertes en unit et intégration, les contrats
API en contract tests et le parcours Admin en E2E.

## Out of Scope

- Création ou édition d'une City depuis l'écran Landing pages.
- Activation indépendante des trois intentions.
- Publication d'une page Locations sans logement public éligible.
- Suppression de logements, POI, articles, guides ou de la City.
- Suppression physique ou restauration depuis l'interface.
- Génération automatique de contenus SEO.
- Prix, disponibilité ou synchronisation Airbnb.

## Open Questions

Aucune question ouverte.
