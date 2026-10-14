# Spec — 097 Menu d'activités séminaire

## Metadata

```yaml
id: 097-seminar-activity-menu
title: "Catalogue d'activités séminaire, prestataires internes et diffusion manuelle sur les pages séminaires"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-14
depends_on: [031-public-marketing-site, 046-local-seo-city-cluster, 048-admin-local-landing-management, 051-seminar-lodging-selection, 052-seminar-lead-modal, 085-photo-upload-heic]
```

## Context

Le Product Owner veut une offre séminaire attrayante et fournie : un « menu »
de 42 activités réparties en 6 catégories (team building, hiver, été,
bien-être, gastronomie, expériences d'exception), présentées en cartes au style
MyStay.

Décisions du Product Owner (conversation du 2026-10-14) :

- les noms des prestataires restent **internes** et ne sont jamais publiés ;
- les cartes ne sont **pas** diffusées dans les pages Découvrir ni dans le Guide ;
- une section dédiée est créée sur `/seminaires` et sur les landings
  `/seminaires/[city-slug]` ; l'Admin y attribue **manuellement** chaque carte ;
- les cartes servent aussi de base aux devis séminaire : chacune porte un
  **prix par personne** et/ou un **prix par groupe**.

Approche retenue : un catalogue éditorial `SeminarActivity` géré par l'Admin,
relié aux POI existants qui jouent le rôle de prestataires (pas de nouvelle
table prestataire : nom, adresse, téléphone et site sont déjà en base). Une
table d'attribution relie chaque carte aux surfaces où elle est diffusée.

## Glossary References

- **Admin**
- **POI**
- **City**
- **Local Landing Page**
- **Soft Delete**
- Nouveaux termes à ajouter au glossaire à l'approbation :
  - **Seminar Activity (Activité séminaire)** : carte du catalogue séminaire,
    gérée par l'Admin, avec description, saison, niveau, image et prix internes.
  - **Activity Provider (Prestataire d'activité)** : POI relié à une Seminar
    Activity pour la préparation des devis. Donnée strictement interne.
  - **Seminar Surface (Surface séminaire)** : emplacement de diffusion d'une
    carte : la page globale `/seminaires` ou une Local Landing Page d'intention
    `SEMINAR`.

## User Stories

### US-01 — Gérer le catalogue

En tant qu'Admin, je crée, modifie, publie, dépublie et supprime (suppression
douce) des activités séminaire, avec titre, catégorie, description, saison,
niveau et image.

### US-02 — Illustrer une activité

En tant qu'Admin, j'envoie une image (JPEG, PNG, WebP, AVIF, HEIC) pour
illustrer une activité et je peux la remplacer.

### US-03 — Relier des prestataires

En tant qu'Admin, je relie une ou plusieurs fiches POI existantes à une
activité, avec une note interne par prestataire (contact, capacité, conditions).

### US-04 — Saisir les prix

En tant qu'Admin, je renseigne un prix par personne et/ou un prix par groupe
pour préparer les devis.

### US-05 — Attribuer les cartes aux pages séminaires

En tant qu'Admin, je choisis sur quelles surfaces (page globale, landing de
chaque commune) une activité est affichée, et dans quel ordre.

### US-06 — Découvrir les activités

En tant que visiteur de `/seminaires` ou `/seminaires/[city-slug]`, je vois les
activités attribuées à cette page et je peux demander une proposition.

## Business Rules

- BR-01 : seul un Admin actif, authentifié et non supprimé lit ou modifie le
  catalogue, les prestataires, les prix et les attributions.
- BR-02 : les prestataires, les notes internes et les prix ne figurent jamais
  dans une réponse publique, un rendu public, les données structurées, le
  sitemap ou les métadonnées. Aucune mention de devis, de tarif ou de
  « sur devis » n'apparaît sur une carte (décision PO du 2026-10-14).
- BR-03 : une Seminar Activity n'apparaît jamais dans les pages Découvrir, le
  Guide, la recherche, la carte ni le sitemap. Elle n'a pas de page dédiée.
- BR-04 : une carte est affichée sur une surface si et seulement si : activité
  publiée et non supprimée, image présente, attribution active à cette surface,
  et, pour une landing, landing publiée selon les règles de la spec 048.
- BR-05 : l'attribution est manuelle et indépendante par surface. Attribuer à
  la page globale n'attribue à aucune landing, et inversement. Aucune
  attribution automatique par catégorie, saison, distance ou prestataire.
- BR-06 : une activité sans image peut être enregistrée et attribuée, mais ne
  peut pas être publiée ; la publication est refusée avec `IMAGE_REQUIRED`.
- BR-07 : l'image est réencodée en WebP via `uploadGuideImage` (bucket
  `guide-photos`, préfixe `seminar-activities/<id>`), selon les règles des
  specs 012 BR-26 et 085. Les images référencées sont ajoutées aux URL
  protégées du nettoyage (spec 070 BR-04) ; le dossier `seminar-activities/`
  n'est pas parcouru par le nettoyage hebdomadaire.
- BR-08 : les prix sont des montants en centimes d'euro, entiers et positifs ou
  nuls, saisis **HT**. Les deux sont facultatifs et peuvent coexister. Ils
  servent uniquement à la préparation interne des devis. Une activité sans prix
  reste publiable. Le prix est porté par l'activité, pas par le prestataire.
- BR-08b : un taux de TVA unique de 20 % s'applique à toutes les activités
  (décision PO du 2026-10-14). Les montants TTC sont calculés, jamais stockés :
  `TTC = round(HT × 1,2)` au centime, arrondi au plus proche (demi vers le haut).
- BR-08c : simulateur interne. Pour un nombre de participants N choisi dans une
  liste de 1 à 30 (valeur par défaut : 10, décision PO du 2026-10-14), le
  total de l'activité est
  `total_HT = price_per_person_cents × N + price_per_group_cents`
  (un prix absent compte pour 0), affiché en HT et en TTC. Le prix par groupe
  est un forfait unique pour tout le groupe, quel que soit N. Cette fonction de
  calcul est pure et partagée avec le futur devis en ligne (spec 098).
- BR-09 : un prestataire est un POI existant non supprimé, de n'importe quelle
  City. Un même POI n'est relié qu'une fois à une activité. Si le POI est
  supprimé ensuite, le lien reste visible en admin avec la mention « fiche
  supprimée ».
- BR-10 : l'ordre d'affichage est propre à chaque surface (champ `position`).
  Une nouvelle attribution est placée en dernier.
- BR-11 : retirer une attribution ou supprimer une activité applique une
  suppression douce (`deleted_at`). Réattribuer une carte à une surface
  restaure la ligne existante au lieu d'en créer une seconde.
- BR-12 : sans carte affichable, la section est absente de la surface.
- BR-13 : toute mutation (activité, image, publication, attribution, ordre)
  revalide la page globale et les landings concernées.
- BR-14 : les 42 activités fournies par le Product Owner sont importées par un
  script idempotent (clé `slug`), non publiées, sans image, sans prix, sans
  prestataire ni attribution.

## Data Model

Migration additive, sans modification des modèles existants hors relations
inverses.

```prisma
enum SeminarActivityCategory {
  TEAM_BUILDING   // Team building & cohésion
  WINTER          // Activités hiver
  SUMMER          // Aventures & activités été
  WELLBEING       // Bien-être & déconnexion
  GASTRONOMY      // Gastronomie & art de vivre
  EXCEPTIONAL     // Découvertes & expériences d'exception
}

model SeminarActivity {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  slug         String                  @unique
  title        String
  category     SeminarActivityCategory
  description  String
  season_label String // ex. « Toute l'année selon la formule »
  level_label  String // ex. « Accessible à sportif »
  is_published Boolean @default(false)

  image_url String?

  // Données internes (BR-02)
  price_per_person_cents Int?
  price_per_group_cents  Int?
  internal_notes         String?

  providers  SeminarActivityProvider[]
  placements SeminarActivityPlacement[]

  @@index([deleted_at, is_published, category])
}

model SeminarActivityProvider {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  activity_id String
  activity    SeminarActivity @relation(fields: [activity_id], references: [id])
  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])
  notes       String?

  @@unique([activity_id, poi_id])
}

model SeminarActivityPlacement {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  activity_id    String
  activity       SeminarActivity          @relation(fields: [activity_id], references: [id])
  // null = page globale /seminaires ; sinon la landing séminaire de cette destination
  destination_id String?
  destination    LocalLandingDestination? @relation(fields: [destination_id], references: [id])
  // "hub" ou destination_id : garantit l'unicité malgré le null (BR-11)
  surface_key    String
  position       Int

  @@unique([activity_id, surface_key])
  @@index([surface_key, deleted_at, position])
}
```

## API Contract

```yaml
openapi: 3.1.0
info: { title: Seminar activity menu (admin), version: 1.0.0 }
components:
  schemas:
    SeminarActivityInput:
      type: object
      additionalProperties: false
      required: [title, category, description, season_label, level_label]
      properties:
        title: { type: string, minLength: 1, maxLength: 120 }
        category: { enum: [TEAM_BUILDING, WINTER, SUMMER, WELLBEING, GASTRONOMY, EXCEPTIONAL] }
        description: { type: string, minLength: 1, maxLength: 400 }
        season_label: { type: string, minLength: 1, maxLength: 80 }
        level_label: { type: string, minLength: 1, maxLength: 80 }
        price_per_person_cents: { type: [integer, 'null'], minimum: 0 }
        price_per_group_cents: { type: [integer, 'null'], minimum: 0 }
        internal_notes: { type: [string, 'null'], maxLength: 2000 }
    SeminarActivityAdmin:
      allOf:
        - $ref: '#/components/schemas/SeminarActivityInput'
        - type: object
          required: [id, slug, is_published, image_url, providers, placements]
          properties:
            id: { type: string, format: uuid }
            slug: { type: string }
            is_published: { type: boolean }
            image_url: { type: [string, 'null'] }
            providers:
              type: array
              items:
                type: object
                required: [poi_id, poi_name, city_name, poi_deleted, notes]
                properties:
                  poi_id: { type: string, format: uuid }
                  poi_name: { type: string }
                  city_name: { type: string }
                  poi_deleted: { type: boolean }
                  notes: { type: [string, 'null'] }
            placements:
              type: array
              items:
                type: object
                required: [surface_key, destination_id, position]
                properties:
                  surface_key: { type: string }
                  destination_id: { type: [string, 'null'], format: uuid }
                  position: { type: integer }
paths:
  /api/admin/seminar-activities:
    get:
      responses:
        '200': { description: 'Liste { items: SeminarActivityAdmin[] } non supprimées, triées par catégorie puis titre' }
    post:
      requestBody: { content: { application/json: { schema: { $ref: '#/components/schemas/SeminarActivityInput' } } } }
      responses:
        '201': { description: SeminarActivityAdmin créée, non publiée }
        '409': { description: SLUG_CONFLICT }
  /api/admin/seminar-activities/{id}:
    patch:
      description: Mise à jour partielle de SeminarActivityInput et/ou de is_published
      responses:
        '200': { description: SeminarActivityAdmin }
        '422': { description: IMAGE_REQUIRED — publication sans image (BR-06) }
    delete:
      responses:
        '204': { description: Suppression douce de l'activité et de ses attributions }
  /api/admin/seminar-activities/{id}/image:
    post:
      requestBody: { content: { multipart/form-data: { schema: { type: object, required: [file], properties: { file: { type: string, format: binary } } } } } }
      responses:
        '200': { description: 'SeminarActivityAdmin avec la nouvelle image_url, plus `url` (même valeur) attendu par le composant partagé ImageUpload' }
        '400': { description: INVALID_TYPE }
        '413': { description: TOO_LARGE }
        '500': { description: UPLOAD_FAILED }
  /api/admin/seminar-activities/{id}/providers:
    put:
      description: Remplace la liste des prestataires (BR-09, BR-11)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              required: [providers]
              properties:
                providers:
                  type: array
                  items:
                    type: object
                    additionalProperties: false
                    required: [poi_id]
                    properties:
                      poi_id: { type: string, format: uuid }
                      notes: { type: [string, 'null'], maxLength: 1000 }
      responses:
        '200': { description: SeminarActivityAdmin }
        '422': { description: POI_NOT_FOUND — POI absent ou supprimé }
  /api/admin/seminar-activities/{id}/placements:
    put:
      description: Remplace la liste des surfaces de l'activité
      requestBody:
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              required: [include_hub, destination_ids]
              properties:
                include_hub: { type: boolean }
                destination_ids: { type: array, items: { type: string, format: uuid } }
      responses:
        '200': { description: SeminarActivityAdmin }
        '422': { description: DESTINATION_NOT_FOUND — destination locale absente ou supprimée }
  /api/admin/seminar-activities/provider-search:
    get:
      description: Recherche de POI prestataires (BR-09), 20 résultats au plus
      parameters:
        - { name: q, in: query, required: true, schema: { type: string, minLength: 2, maxLength: 80 } }
      responses:
        '200':
          description: '{ items: [{ poi_id, poi_name, city_name }] } — POI non supprimés dont le nom contient q'
  /api/admin/seminar-activity-placements/order:
    put:
      description: Réordonne les cartes d'une surface
      requestBody:
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              required: [surface_key, activity_ids]
              properties:
                surface_key: { type: string }
                activity_ids: { type: array, items: { type: string, format: uuid } }
      responses:
        '200': { description: Ordre enregistré }
        '422': { description: PLACEMENT_MISMATCH — liste différente des attributions actives }
```

Toutes les routes : `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`,
`404 SEMINAR_ACTIVITY_NOT_FOUND`, `500` selon le format
`{ "error": { "code", "message", "details" } }`. Entrées validées avec Zod.
Lecture publique : query serveur uniquement, sans API publique, renvoyant
seulement `id, title, category, description, season_label, level_label,
image_url` (BR-02).

## UI Behaviour

### Admin — `/admin/seminar-activities` (Shadcn/ui)

- Entrée « Activités séminaire » dans la navigation admin.
- Tableau : miniature, titre, catégorie, statut (Publiée / Brouillon / Sans
  image), prix, nombre de prestataires, surfaces attribuées. Filtres catégorie
  et statut.
- Panneau d'édition latéral, quatre blocs :
  1. **Carte** : titre, catégorie, description, saison et niveau (selects sur
     des listes prédéfinies issues du catalogue, ajustement PO du 2026-10-14 ;
     une valeur enregistrée hors liste reste affichée), image (envoi,
     aperçu 4/3, remplacement), interrupteur Publier (désactivé sans image,
     avec explication).
  2. **Prix (interne)** : prix par personne HT et prix par groupe HT (forfait),
     en euros avec deux décimales, stockés en centimes ; équivalents TTC
     (TVA 20 %) affichés en direct.
     Simulateur : select « Participants » de 1 à 30, 10 par défaut, total HT et TTC calculé
     automatiquement selon BR-08c.
  3. **Prestataires (interne)** : recherche de POI par nom avec ville,
     liste des liens avec note par prestataire, retrait.
  4. **Diffusion** : case « Page Séminaires » et une case par landing
     séminaire (nom de commune + statut publiée/non publiée).
- Onglet « Ordre d'affichage » : choix d'une surface, liste réordonnable par
  glisser-déposer et boutons haut/bas (accessibilité clavier).
- Chargement, succès et erreurs selon la spec 083 (erreurs en ligne).

### Public — section « Le menu d'activités »

- `/seminaires` : après la section Formats (`SeminarFormats`).
- `/seminaires/[city-slug]` : dans `beforeFinalCta`, après `SeminarLodgings`.
- En-tête aligné sur la spec 051 : `MarketingEyebrow` « Activités », H2
  « Le menu d'activités. », introduction validée par le PO le 2026-10-14 :
  « Team building, sports de montagne, bien-être ou gastronomie : nous
  composons avec nos partenaires locaux le programme qui fait vivre votre
  séminaire, en toute saison. »
- Cartes compactes cohérentes avec la spec 051 : photo 4/3, fond blanc,
  arrondis 26 px, ombre douce, catégorie en rose uppercase, titre gras,
  description en 13 px justifiée avec césure (ajustement PO du 2026-10-14), puis
  un pied de carte sur deux colonnes séparées d'un filet, « Saison » puis
  « Niveau » (ajustements PO du 2026-10-14) : uniquement les saisons de
  l'activité, en icônes Lucide colorées (`Snowflake` hiver bleu, `Flower2`
  printemps vert, `Sun` été ambre, `Leaf` automne orange), avec la
  précision éventuelle (« Selon la formule ») en petit dessous ; un libellé
  sans saison identifiable (« Selon conditions ») s'affiche en texte
  gras précédé de `CalendarDays` ; le niveau en texte gras précédé de `Gauge`. Libellé complet de la saison
  conservé pour les lecteurs d'écran. Aucun prix, aucune mention de devis, aucun prestataire,
  aucun lien de détail, aucun bouton sur la carte : la section est une vitrine
  esthétique des capacités d'encadrement de MyStay (décision PO du 2026-10-14).
- Grille 1 colonne mobile (375 px), 2 sur tablette, 3 sur desktop, dans l'ordre
  `position` de la surface.
- Six cartes affichées au départ ; au-delà, un bouton « Voir plus d'activités
  (N) » révèle les suivantes, puis disparaît ; le focus passe à la première
  carte révélée (ajustement PO du 2026-10-14).
- Sous-menu de catégories en pastilles, entre l'introduction et les cartes
  (ajustement PO du 2026-10-14) : « Toutes » puis uniquement les catégories
  ayant au moins une carte affichable sur la surface, dans l'ordre du menu,
  libellés courts. Un clic filtre les cartes (boutons `aria-pressed`) et
  réapplique la limite de six cartes. Le sous-menu est absent si une seule
  catégorie est représentée. Défilement horizontal sur mobile, retour à la
  ligne dès 640 px.
- Pas de bouton d'appel à l'action propre à la section : les CTA existants de
  la page restent les seuls points d'entrée vers la demande de proposition.

## Acceptance Criteria

| ID | Critère | Tests |
|---|---|---|
| AC-01 | CRUD Admin : création non publiée, modification, suppression douce ; slug unique | contract + integration |
| AC-02 | Auth absente, non Admin, corps ou UUID invalides refusés sans écriture | contract |
| AC-03 | Image : formats acceptés convertis en WebP, HEIC compris ; type ou taille invalides refusés | contract + integration |
| AC-04 | Publication refusée sans image (`IMAGE_REQUIRED`) | contract |
| AC-05 | Prix : centimes HT ≥ 0, null accepté, les deux coexistent ; jamais présents dans le rendu public | unit + integration |
| AC-05b | TVA : TTC calculé à 20 % avec arrondi au centime | unit |
| AC-05c | Simulateur : total HT/TTC correct pour N de 1 à 30, prix absents comptés 0, forfait groupe indépendant de N | unit |
| AC-06 | Prestataires : lien unique par POI, POI supprimé refusé à l'ajout puis signalé après suppression ; jamais publics | contract + integration |
| AC-07 | Attributions indépendantes hub / landing ; landing d'une autre intention refusée ; réattribution restaure la ligne | contract + integration |
| AC-08 | Ordre par surface persistant ; liste incohérente refusée | contract |
| AC-09 | Affichage public conforme à BR-04 ; section absente sans carte ; landing inactive reste 404 | unit + integration |
| AC-10 | Aucune activité dans Découvrir, Guide, recherche, carte, sitemap ou JSON-LD | integration |
| AC-11 | Mutations revalident les surfaces concernées | unit |
| AC-12 | Import des 42 activités idempotent, non publiées, sans attribution | integration |
| AC-13 | Parcours Admin → image → publication → attribution → carte visible sur hub et landing, sans débordement à 375 px | e2e |

## Out of Scope

- Génération, envoi ou suivi des devis : traité par la spec 098 (devis en ligne).
- Sélection d'activités par le visiteur dans le formulaire de demande (spec 052 inchangée).
- Prix par prestataire, grilles tarifaires par saison ou par paliers de groupe.
- Page de détail par activité, filtres publics autres que le sous-menu de catégories, traduction des cartes.
- Diffusion dans le Guide, les pages Découvrir ou le Guide privé.
- Création de nouveaux POI depuis cet écran.

## Open Questions

- OQ-01 (resolved 2026-10-14) : prix strictement internes. Les cartes sont
  une vitrine esthétique, sans prix ni mention de devis.
- OQ-02 (resolved 2026-10-14) : prix saisis HT ; TTC calculé (BR-08b).
- OQ-03 (resolved 2026-10-14) : select de 1 à 30 participants pour calculer
  automatiquement le total (BR-08c).
- OQ-04 (resolved 2026-10-14) : prix porté par l'activité.
- OQ-05 (resolved 2026-10-14) : introduction validée (UI Behaviour).
- OQ-06 (resolved 2026-10-14) : TVA unique à 20 % ; simulateur affiché par
  défaut pour un groupe de 10 personnes ; le prix par groupe est un forfait
  unique ajouté au prix par personne × N.

Ajustements techniques du 2026-10-14, sans effet métier : l'attribution
locale référence la `LocalLandingDestination` (dont la landing séminaire est
unique) plutôt que la `LocalLandingPage`, qui peut ne pas encore exister ;
le chemin de stockage n'est pas conservé (déduit de l'URL) ; ajout de la
recherche de prestataires.

Spec approuvée explicitement par le Product Owner en conversation le
2026-10-14 (« ne lance que le chantier des cards »). La demande de devis de la
spec 052 reste inchangée.
