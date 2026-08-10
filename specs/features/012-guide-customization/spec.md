# Spec — 012 Guide Customization

## Metadata

```yaml
id: 012-guide-customization
title: "Personnalisation du guide par logement"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-07-21
depends_on: [010-dashboard-owner, 011-qr-code-owner, 002-categories, 003-poi-list]
```

---

## Context

Un Owner peut personnaliser l'expérience affichée aux Tourists de son logement. Il peut importer une photo du logement, rédiger un message d'accueil long, renseigner les informations pratiques, mettre en avant certains POI (ses recommandations personnelles), et modifier l'ordre des catégories. Ces personnalisations s'appliquent quand un Tourist arrive via le QR code du logement (`?lodging=[id]`) ou quand le mode séjour est conservé par cookie.

---

## Glossary References

- **Guide** : ensemble des catégories et POI pour une City
- **Lodging** : logement dont l'Owner personnalise le guide
- **Featured POI** : POI mis en avant par l'Owner dans une catégorie
- **Owner Recommendation Comment** : commentaire personnel facultatif ajouté par l'Owner à un Featured POI
- **Welcome Message** : message personnalisé affiché en haut du guide
- **Cover Photo** : photo du logement affichée sur la page d'accueil séjour
- **Practical Info** : informations pratiques du logement visibles dans la page logement

---

## User Stories

### US-01 — Message d'accueil personnalisé

**As an** Owner
**I want to** écrire un message d'accueil pour mes Tourists
**So that** ils se sentent accueillis et guidés dès l'arrivée

#### Acceptance Criteria

- **AC-01-01**: Given le formulaire de personnalisation, When l'Owner saisit un message d'accueil (max 400 mots), Then il est sauvegardé et affiché sur la page d'accueil séjour pour les Tourists de ce logement
- **AC-01-02**: Given un Tourist arrivant via `?lodging=[id]`, When la page `/` charge en mode séjour, Then la photo du logement, le message d'accueil si renseigné et un CTA vers `/guide/[city-slug]` s'affichent

### US-02 — Recommandations personnelles

**As an** Owner
**I want to** sélectionner mes POI favoris
**So that** mes Tourists découvrent les adresses que je recommande

#### Acceptance Criteria

- **AC-02-01**: Given la liste des POI d'une catégorie, When l'Owner en sélectionne jusqu'à 5 comme favoris, Then ces POI apparaissent dans la page `/nos-recommandations` pour les Tourists de ce logement, et les groupes inter-villes dont la City commence par "Les" affichent un titre contracté en "Aux" (ex. "Aux Contamines-Montjoie")
- **AC-02-02**: Given un POI favori local ou inter-ville, When l'Owner saisit un commentaire personnel facultatif, Then le commentaire est sauvegardé avec la recommandation et affiché sur `/nos-recommandations` ainsi que sur la fiche publique du logement
- **AC-02-03**: Given les recommandations, When un Tourist arrive sans `?lodging=[id]`, Then le guide standard s'affiche sans personnalisation
- **AC-02-04**: Given l'Owner saisit un commentaire sur un POI favori, When il modifie le texte, Then un compteur de mots affiche la progression sur 300 mots et la sauvegarde est refusée au-delà de cette limite
- **AC-02-05**: Given un POI d'une autre City sélectionné dans "Recommandations ailleurs", When l'Owner consulte la sélection, Then il peut saisir et modifier le même commentaire facultatif de 300 mots que pour un POI local
- **AC-02-06**: Given un Tourist en séjour actif, When il ouvre la fiche d'un POI recommandé avec un commentaire Owner, Then il voit uniquement le commentaire associé à son Lodging actif

### US-03 — Ordre des catégories

**As an** Owner
**I want to** réorganiser l'ordre des catégories
**So that** les catégories les plus pertinentes pour mes Tourists apparaissent en premier

#### Acceptance Criteria

- **AC-03-01**: Given le dashboard de personnalisation, When l'Owner réordonne les catégories par drag-and-drop, Then cet ordre est sauvegardé et appliqué pour les Tourists de ce logement

### US-04 — Informations pratiques et photo du logement

**As an** Owner
**I want to** renseigner les informations pratiques et importer une photo de mon logement
**So that** mes Tourists trouvent les informations utiles sans friction

#### Acceptance Criteria

- **AC-04-01**: Given le dashboard de personnalisation, When l'Owner renseigne les informations pratiques, Then elles sont sauvegardées et affichées sur `/le-logement`
- **AC-04-02**: Given le dashboard de personnalisation, When l'Owner importe une image valide, Then elle est convertie si nécessaire, stockée dans Supabase Storage et affichée en haut de la page d'accueil séjour
- **AC-04-03**: Given l'Owner renseigne une adresse de logement, When elle est sauvegardée, Then le serveur tente de la géocoder via Mapbox depuis le centre de la City et stocke les coordonnées du logement si le résultat est valide
- **AC-04-04**: Given un Tourist en séjour actif, When il ouvre `/le-logement`, Then il consulte un guide vertical en quatre sections ancrées et le menu mobile de cette route navigue uniquement entre ces sections
- **AC-04-05**: Given une photo JPEG dont l’orientation d’affichage est portée par les métadonnées EXIF, When l’Owner l’importe, Then le serveur applique cette orientation aux pixels avant la conversion WebP et l’image stockée conserve le cadrage visible attendu.

---

## Business Rules

- **BR-01**: La personnalisation est par Lodging — pas par Owner global
- **BR-02**: Sans `?lodging=[id]` dans l'URL, le guide standard s'affiche (pas de personnalisation)
- **BR-03**: Pour la City du Lodging, maximum 5 POI favoris par catégorie. Pour chaque autre City, maximum 5 POI favoris toutes catégories confondues.
- **BR-04**: Un Featured POI peut conserver un commentaire personnel facultatif `owner_note`, limité à 300 mots. Aucun rating `owner_rating` n'est conservé.
- **BR-05**: Le message d'accueil est limité à 400 mots
- **BR-06**: La personnalisation n'ajoute pas de POI inexistants — elle filtre, réordonne et met en avant les POI déjà en base
- **BR-07**: Un Owner ne peut lire ou modifier que la personnalisation de ses propres Lodgings
- **BR-08**: Un POI favori local ou inter-ville doit exister, être actif et ne pas être soft-deleted. Son bucket est dérivé par `poi.city_id === lodging.city_id` : local si vrai, "ailleurs" sinon.
- **BR-09**: Les recommandations inter-villes ne modifient jamais le périmètre géographique du Guide de la City. Elles sont exposées uniquement dans les surfaces dédiées aux recommandations Owner, y compris le bloc contextuel de leur fiche POI quand le séjour actif correspond.
- **BR-10**: Si `category_order` contient des slugs inconnus, inactifs ou sans POI visible, ces slugs sont isolés dans `ignored_category_slugs` et ne sont pas sauvegardés. Les catégories valides restantes sont sauvegardées ; aucun statut de Category n'est modifié par cette spec.
- **BR-11**: `featured_pois` accepte au maximum 100 entrées par requête comme limite technique, tout en appliquant les limites métier de 5 favoris par catégorie locale et de 5 favoris par autre City
- **BR-12**: Si un `lodging` valide est actif, le guide public de la City reste complet : les catégories et listes POI ne sont jamais filtrées exclusivement sur `featured_pois`. Les `featured_pois` sont visibles dans `/nos-recommandations`, sur la fiche publique du logement et, pour leur seul commentaire contextuel, sur leur fiche POI.
- **BR-13**: L'upload image Owner est autorisé pour les photos de logement. Les images sont validées côté serveur, limitées à 5 Mo et stockées dans le bucket `guide-photos`. Lorsqu’une image est convertie en WebP, son orientation EXIF est appliquée aux pixels avant l’encodage afin que le fichier stocké ne dépende plus de cette métadonnée.
- **BR-14**: Les libellés publics utilisent le nom produit MyStay.
- **BR-15**: `owner_note` est normalisé par trim ; une valeur vide devient `null`. Le commentaire est rendu comme texte simple, sans interprétation Markdown ou HTML.
- **BR-16**: Les coordonnées du logement dérivées de `lodging_address` sont calculées uniquement côté serveur via Mapbox Geocoding avec proximité City. Gemini ne doit jamais géocoder l'adresse du logement ni calculer de distance.
- **BR-17**: En mode séjour actif, les cards POI et fiches POI affichent la distance depuis les coordonnées du logement quand elles existent. Si le Tourist active sa position GPS, cette distance affichée est remplacée côté client par la distance depuis sa position actuelle. Les zones `primary` / `nearby` et le tri serveur restent calculés depuis le centre de la City.
- **BR-18**: Sur `/le-logement`, les horaires publics sont constants pour tous les Lodgings : arrivée à partir de `16 h` et départ à `10 h`. Ils sont définis dans la couche de présentation et ne nécessitent aucun champ persistant.
- **BR-19**: Le menu mobile contextuel « Guide du logement » et la palette colorée associée sont limités à `/le-logement`. Les autres routes publiques conservent leur menu et leur charte existants.
- **BR-20**: Le champ `welcome_message` reste sauvegardé et disponible pour les surfaces publiques prévues par la spec, mais `/le-logement` ne rend ni ce contenu ni une salutation de bienvenue de remplacement. Cette règle est uniquement présentationnelle et ne modifie ni le modèle, ni l'API, ni le formulaire Owner.
- **BR-21**: Le récapitulatif supérieur de `/le-logement` affiche uniquement les horaires d'arrivée et de départ. Les identifiants Wi-Fi ne sont rendus qu'une fois, dans la carte détaillée `Réseau Wi-Fi` de la section `Infos pratiques`, avec les actions de copie existantes.
- **BR-22**: Le catalogue des icônes de blocs pratiques propose aussi `Piscine`
  (`waves-ladder`), `Jacuzzi` (`bubbles`), `Climatisation` (`air-vent`),
  `Skis` (`mountain-snow`) et `Terrasse` (`umbrella`). Ces slugs Lucide sont
  acceptés par la validation API et rendus dans le dashboard Owner comme dans
  le guide privé.
- **BR-23**: Dans la page privée `Consignes du logement`, la description de
  chaque bloc pratique est rendue avec le moteur Markdown sécurisé du guide,
  pour toutes les variantes de carte (standard, média, téléphone et
  recyclage). Le titre reste du texte simple et le HTML brut est ignoré.
- **BR-24**: Les champs `checkout_instructions` et `house_rules` restent dans
  le modèle pour compatibilité, mais ne sont plus éditables par l'Owner et ne
  pilotent plus les contenus affichés. Les guides utilisent les listes fixes
  MyStay définies par les specs 036 et 039. Une sauvegarde d'autres champs ne
  supprime pas les anciennes valeurs persistées.

---

## Data Model

```prisma
model LodgingCustomization {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  lodging_id      String   @unique
  lodging         Lodging  @relation(fields: [lodging_id], references: [id])
  welcome_message String?
  category_order  String[] # slugs des catégories dans l'ordre Owner
  cover_photo_url String?
  lodging_address String?
  lodging_latitude Float?
  lodging_longitude Float?
  wifi_ssid String?
  wifi_password String?
  parking_info String?
  equipment_info String?
  checkout_instructions String?
  trash_info String?
  trash_location String?
  house_rules String?
  emergency_contacts String?
  useful_services String?
}

model LodgingFeaturedPoi {
  id              String   @id @default(uuid())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  lodging_id      String
  lodging         Lodging         @relation(fields: [lodging_id], references: [id])
  poi_id          String
  poi             PointOfInterest @relation(fields: [poi_id], references: [id])
  owner_note      String?
  sort_order      Int      @default(0)

  @@unique([lodging_id, poi_id])
  @@index([lodging_id])
  @@index([poi_id])
}
```

---

## API Contract

```yaml
paths:
  /api/dashboard/lodgings/{id}/customization:
    get:
      summary: "Récupérer la personnalisation d'un logement"
      tags: [guide-customization]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Personnalisation du logement
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingCustomizationResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
    put:
      summary: "Sauvegarder la personnalisation"
      tags: [guide-customization]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                welcome_message:
                  type: string
                  description: "Max 400 mots"
                category_order:
                  type: array
                  items:
                    type: string
                featured_pois:
                  type: array
                  maxItems: 100
                  items:
                    type: object
                    required: [poi_id, sort_order]
                    properties:
                      poi_id: { type: string }
                      owner_note:
                        type: string
                        nullable: true
                        description: "Commentaire personnel facultatif, maximum 300 mots"
                      sort_order: { type: integer }
                cover_photo_url:
                  type: string
                  nullable: true
                lodging_address:
                  type: string
                  nullable: true
                wifi_ssid:
                  type: string
                  nullable: true
                wifi_password:
                  type: string
                  nullable: true
                parking_info:
                  type: string
                  nullable: true
                equipment_info:
                  type: string
                  nullable: true
                checkout_instructions:
                  type: string
                  nullable: true
                trash_info:
                  type: string
                  nullable: true
                trash_location:
                  type: string
                  nullable: true
                house_rules:
                  type: string
                  nullable: true
                emergency_contacts:
                  type: string
                  nullable: true
                useful_services:
                  type: string
                  nullable: true
      responses:
        "200":
          description: Personnalisation sauvegardée
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingCustomizationResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/cities/{slug}:
    get:
      summary: "Guide public — données City avec personnalisation optionnelle"
      tags: [guide-customization]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: lodging
          in: query
          required: false
          schema:
            type: string
            format: uuid
          description: "lodging_id — active la personnalisation si présent"

  /api/cities/{slug}/categories:
    get:
      summary: "Catégories du Guide avec ordre personnalisé optionnel"
      tags: [guide-customization]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: lodging
          in: query
          required: false
          schema:
            type: string
            format: uuid

  /api/cities/{slug}/categories/{category-slug}/pois:
    get:
      summary: "Liste POI publique de la City, avec contexte lodging optionnel"
      tags: [guide-customization]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: category-slug
          in: path
          required: true
          schema:
            type: string
        - name: lodging
          in: query
          required: false
          schema:
            type: string
            format: uuid

components:
  schemas:
    LodgingCustomizationResponse:
      type: object
      required: [lodging_id, welcome_message, category_order, featured_pois, ignored_category_slugs]
      properties:
        lodging_id:
          type: string
        welcome_message:
          type: string
          nullable: true
        category_order:
          type: array
          items:
            type: string
        featured_pois:
          type: array
          items:
            $ref: "#/components/schemas/FeaturedPoi"
        ignored_category_slugs:
          type: array
          description: "Slugs inconnus, inactifs ou sans POI visible retirés de category_order"
          items:
            type: string

    FeaturedPoi:
      type: object
      required: [poi_id, category_id, owner_note, sort_order]
      properties:
        poi_id:
          type: string
        category_id:
          type: string
        owner_note:
          type: string
          nullable: true
          description: "Commentaire personnel facultatif, maximum 300 mots"
        sort_order:
          type: integer

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: object }

  responses:
    BadRequest:
      description: Paramètre invalide, limite dépassée ou POI hors périmètre
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: Non authentifié
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Le logement n'appartient pas à cet Owner
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Logement introuvable
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Page `/dashboard/lodgings/[id]/customize`
- Section "Message d'accueil" : textarea Shadcn, compteur mots
- Section "Photo du logement" : upload image Owner, validation serveur, URL publique sauvegardée
- Section "Infos pratiques" : adresse, Wi-Fi, parking, équipements, déchets,
  contacts d'urgence et services utiles. Les consignes de départ et le
  règlement intérieur fixes ne possèdent aucun champ de saisie Owner.
- Les erreurs de validation du payload de personnalisation sont affichées avec le champ concerné ; le dashboard ne doit pas se limiter au message générique "Payload invalide"
- Section "Mes recommandations" : liste des catégories, chaque catégorie expand pour voir/sélectionner les POI favoris
- Les POI locaux proposés à la sélection appartiennent à la City du Lodging
- Chaque POI sélectionné affiche un textarea "Votre mot pour les voyageurs" et un compteur `X / 300 mots`
- Section "Recommandations ailleurs" : recherche d'autres villes et sélection de 5 POI maximum par City
- Chaque POI inter-ville sélectionné affiche aussi le textarea "Votre mot pour les voyageurs" et le compteur `X / 300 mots`
- Le commentaire est facultatif ; le bouton de sauvegarde est désactivé si au moins un commentaire dépasse 300 mots
- Aucun rating Owner n'est proposé
- Section "Ordre des catégories" : drag-and-drop (dnd-kit)
- Bouton "Sauvegarder" sticky en bas ; désactivé tant qu'un bloc pratique personnalisé n'a pas de titre ou qu'une URL vidéo saisie n'est pas un lien YouTube valide
- Preview : bouton "Voir le guide comme un Tourist" → ouvre `/guide/[city-slug]?lodging=[id]` dans un nouvel onglet

### Pages publiques
- `/` en mode séjour affiche la photo du logement, le message d'accueil et un CTA vers `/guide/[city-slug]`
- `/le-logement` affiche un guide vertical mobile-first en quatre sections successives : `Bienvenue`, `Infos pratiques`, `Bon à savoir` et `Départ`. Le hero présente la photo, le nom du Lodging, la City et le CTA d'itinéraire lorsque l'adresse existe, sans salutation ni message Owner. Le récapitulatif supérieur affiche uniquement les horaires constants `Arrivée à partir de 16 h` et `Départ à 10 h`, sans doublon Wi-Fi. Une navigation d'ancrage sticky permet d'atteindre les quatre sections.
- La section `Bienvenue` conserve son titre et ses raccourcis vers les autres sections, mais n'affiche aucune carte de message. Le `welcome_message` reste intact en base et continue d'être rendu sur les autres surfaces qui le prévoient.
- Sur `/le-logement` uniquement, le bouton du menu mobile ouvre un tiroir plein écran intitulé `Guide du logement`, contenant les quatre mêmes destinations avec icônes. Un choix ferme le tiroir puis positionne la section demandée. Le menu public des autres routes est inchangé.
- La section `Infos pratiques` affiche les données Owner disponibles sous forme de bento cards : adresse et itinéraire, vidéo, parking, Wi-Fi, services et urgences. La section `Bon à savoir` affiche les équipements et les blocs pratiques personnalisés. La section `Départ` affiche toujours les consignes fixes et les poubelles. Le règlement intérieur fixe est affiché dans la vue `Équipements` du guide privé. Les autres blocs sans donnée sont omis sans créer de contenu fictif.
- La palette de `/le-logement` utilise un bleu principal et des accents joyeux jaune, vert et rose/corail, tout en conservant une lisibilité WCAG et la charte globale des autres pages.
- Les consignes de départ peuvent être cochées localement lorsqu'elles sont structurées en liste. Cet état n'est ni persisté ni envoyé au serveur.
- `/nos-recommandations` affiche les recommandations locales groupées par catégorie puis une section "À découvrir ailleurs" groupée par City, avec le commentaire Owner lorsqu'il est renseigné. Les titres de groupes utilisent une graisse light/thin ; les titres de catégories locales affichent l'icône de leur Category à côté du libellé, dans une pastille colorée assez grande pour être un repère visuel. Les titres de City de cette section contractent le préfixe "À" avec les noms commençant par "Les" : "Les Contamines-Montjoie" devient "Aux Contamines-Montjoie".
- Les textes personnalisés Owner affichés publiquement (titre de `/nos-recommandations`, message d'accueil sur `/guide/[city-slug]` et `/le-logement`, commentaire Owner contextualisé sur fiche POI) utilisent la font Story Script via l'alias Tailwind `font-hand`
- Sur `/nos-recommandations`, chaque recommandation Owner non-randonnée affiche le statut horaire public déjà utilisé par les cards POI quand les données horaires existent : badge "Ouvert" ou "Fermé", puis "Ferme à <heure>" si ouvert ou "Ouvre <jour/heure>" si fermé. Si `is_open_now` et `hours` ne permettent pas de déterminer le statut, aucun badge horaire n'est rendu. Les cards de recommandation n'affichent jamais le nom de catégorie en texte. Les cards locales et les cards "À découvrir ailleurs" n'affichent pas d'icône de catégorie. Les cards textuelles utilisent un fond blanc ; les fonds crème/sable ne sont pas utilisés.
- Sur les petites cards de `/nos-recommandations`, aucun bouton interne "Voir" n'est rendu : la card entière est déjà cliquable vers la fiche POI.
- `/guide/[city-slug]/logements/[lodging-slug]` affiche les recommandations locales puis une section "À découvrir ailleurs" séparée et groupée par City, avec les commentaires Owner
- Les liens d'une recommandation utilisent toujours le slug de la City réelle du POI
- `/guide/[city-slug]/[category-slug]/[poi-slug]` affiche "Le mot de votre hôte" uniquement si le cookie de séjour identifie le Lodging qui recommande ce POI avec une note non vide
- Le commentaire Owner n'est affiché sur aucune liste géographique. Une fiche POI sans contexte de séjour actif reste générale et n'affiche aucun commentaire Owner.
- `/guide/[city-slug]?lodging=[id]` affiche tous les POI disponibles du Guide de la City, avec message d'accueil et ordre personnalisé éventuels, sans filtrage exclusif sur les recommandations Owner
- `/guide/[city-slug]/[category-slug]?lodging=[id]` affiche tous les POI disponibles de cette catégorie dans le Guide de la City, sans filtrage exclusif sur les recommandations Owner
- En mode séjour actif avec coordonnées logement disponibles, les cards POI et fiches POI affichent `Situé à X m/km du logement`; si le GPS du Tourist est activé, elles affichent `Situé à X m/km de votre position actuelle`.
- Si `lodging` est absent, inconnu, supprimé, inactif ou associé à une autre City, le guide standard s'affiche sans personnalisation

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Message d'accueil sauvegardé | integration |
| AC-01-02 | Accueil séjour affiche photo, message et CTA guide | integration |
| AC-02-01 | POI favoris affichés dans `/nos-recommandations` | integration |
| AC-02-02 | Commentaire Owner sauvegardé et affiché dans les surfaces de recommandations | contract + integration |
| AC-02-03 | Sans lodging param → guide standard | unit |
| AC-02-04 | Compteur de mots et rejet au-delà de 300 mots | unit + contract |
| AC-02-05 | Commentaire éditable sur les POI inter-villes | unit |
| AC-02-06 | Commentaire du seul Lodging actif affiché sur la fiche POI recommandée | unit + integration |
| AC-03-01 | Ordre catégories sauvegardé et appliqué | integration |
| AC-04-01 | Infos pratiques sauvegardées et affichées | integration |
| AC-04-02 | Upload photo logement sauvegardé et affiché | contract + unit |
| AC-04-03 / BR-16 / BR-17 | Adresse logement géocodée via Mapbox et distance POI affichée depuis appartement puis GPS | unit + integration |
| AC-04-04 / BR-18 / BR-19 | `/le-logement` vertical, navigation d'ancrage et menu mobile contextuel limité à cette route, horaires constants et palette colorée | unit + integration |
| AC-04-05 | Orientation EXIF appliquée avant conversion WebP | unit |
| BR-20 | Message de bienvenue conservé côté données mais absent du rendu de `/le-logement` | integration |
| BR-21 | Récapitulatif limité aux horaires ; Wi-Fi rendu uniquement dans sa carte détaillée | integration |
| BR-22 | Catalogue d'icônes d'équipements disponible et sélectionnable | unit |
| BR-23 | Markdown rendu dans toutes les variantes de blocs pratiques privés | unit |
| BR-07 | Owner isolation sur GET/PUT customization | contract |
| BR-08/09 | Bucketing local/inter-ville sans étendre les listes du Guide | unit |
| BR-10 | Catégories invalides isolées et non sauvegardées | unit |
| BR-12 | Guide public complet conservé en mode lodging ; recommandations visibles sur les surfaces Owner dédiées | unit |

---

## Out of Scope

- Ajout de POI custom non référencés par Gemini (MVP 3)
- Personnalisation des photos des POI (MVP 3)
- Rating Owner sur une recommandation POI
- Guide multilingue par logement (post-MVP)

---

## Open Questions

Aucune — spec complète et approuvée.
