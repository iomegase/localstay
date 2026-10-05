# Spec — 063 Copie et optimisation des photos des POI

## Metadata

```yaml
id: 063-poi-photo-mirroring
title: "Copier les photos des POI publiés dans le stockage MyStay pour les servir optimisées"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-05
updated_at: 2026-10-05
depends_on:
  - 041-public-local-discovery
  - 022-admin-poi-management
bounded_context: public-discovery
implementation_gate: "Design validé par le PO le 2026-10-05 (approche A : table de correspondance PoiPhotoMirror, copie à la publication + tâche quotidienne, crédit dans le texte de présentation). Spec en attente d'approbation."
```

---

## Context

Les photos des POI publiés sont des URL de sites tiers, principalement les sites des
établissements eux-mêmes (21 POI publiés, environ 100 photos, 18 domaines au
2026-10-05). Elles sont affichées en lien direct (`<img>` brut, spec 041 BR-26) :

- non redimensionnées ni converties (audit SEO/GEO du 2026-10-05, constat C-13) ;
- l'image principale d'une fiche, élément LCP, vient d'un serveur tiers lent ;
- l'optimiseur `next/image` ne peut pas les traiter, ses domaines étant limités par
  `remotePatterns` ; autoriser tous les domaines ferait de l'optimiseur un relais ouvert ;
- une photo disparaît dès que l'établissement refait son site.

Décision PO du 2026-10-05 : **MyStay obtiendra l'accord des établissements** pour
utiliser leurs photos. Sur cette base, toutes les photos des POI publiés sont copiées
une fois dans le stockage MyStay (Supabase `guide-photos`, déjà autorisé pour
l'optimiseur), sans case d'autorisation par POI. L'origine reste créditée dans le texte
de présentation de la fiche.

Les mécanismes existants qui reposent sur les URL d'origine restent inchangés :
détection des liens morts (`photos_status`), réparation par le site officiel
(`healPoiPhotos`) et import, qui dédoublonne par URL. C'est pourquoi la liste `photos`
du POI n'est pas modifiée : la copie est rangée à côté, dans une table de correspondance.

---

## Glossary References

- **POI** — Point of Interest, lieu recommandé (`PointOfInterest`).
- **Photo d'origine** — URL présente dans `PointOfInterest.photos`.
- **Copie (mirror)** — fichier WebP stocké dans `guide-photos/pois/<poiId>/`, associé à
  une photo d'origine.
- **Fiche publique** — page `/decouvrir/[city]/[category]/[poi]` (spec 041).

---

## User Stories

### US-01 — Copier automatiquement les photos des POI publiés

**As a** Product Owner
**I want to** que les photos des POI publiés soient copiées dans le stockage MyStay
**So that** elles soient servies redimensionnées, rapides et durables

#### Acceptance Criteria

- **AC-01-01**: Given un POI que l'admin publie (`discovery_status` passe à
  `PUBLISHED`), When la publication réussit, Then la copie de ses photos est lancée sans
  retarder ni faire échouer la réponse de publication.
- **AC-01-02**: Given une photo d'origine valide, When elle est copiée, Then un fichier
  WebP de 1 600 px de large au maximum (orientation EXIF appliquée, qualité 82) est
  stocké dans `guide-photos/pois/<poiId>/<empreinte>.webp`, et une ligne
  `PoiPhotoMirror` relie `source_url` et `storage_url`.
- **AC-01-03**: Given une photo déjà copiée pour ce POI, When la copie est relancée,
  Then aucun nouveau fichier ni aucune nouvelle ligne n'est créé.
- **AC-01-04**: Given des POI publiés dont certaines photos n'ont pas de copie, When la
  tâche quotidienne s'exécute, Then elle copie les photos manquantes, dans la limite de
  son lot.
- **AC-01-05**: Given les POI déjà publiés avant la mise en service, When le script de
  reprise est lancé, Then toutes leurs photos copiables sont copiées.

### US-02 — Télécharger les photos en sécurité

**As a** Product Owner
**I want to** que le téléchargement des photos tierces ne puisse pas être détourné
**So that** la copie ne crée ni faille ni coût incontrôlé

#### Acceptance Criteria

- **AC-02-01**: Given une URL non `https`, When la copie est tentée, Then elle est
  refusée sans requête réseau.
- **AC-02-02**: Given une URL dont l'hôte est une adresse IP privée, locale ou réservée
  (ou `localhost`), When la copie est tentée, Then elle est refusée sans requête réseau.
- **AC-02-03**: Given une réponse dont le type n'est pas `image/*`, qui dépasse 8 Mo ou
  10 s, ou dont le contenu n'est pas décodable par `sharp`, When la copie est tentée,
  Then aucune copie n'est créée et l'échec est journalisé avec l'identifiant du POI.
- **AC-02-04**: Given une copie en échec, When la tâche quotidienne suivante
  s'exécute, Then la photo est retentée.

### US-03 — Afficher les copies optimisées

**As a** voyageur
**I want to** que les photos des lieux s'affichent vite, même sur mobile
**So that** je découvre les adresses sans attendre

#### Acceptance Criteria

- **AC-03-01**: Given une photo d'origine qui possède une copie, When une surface
  publique ou le guide privé l'affiche (cartes, fiche, image de partage, JSON-LD),
  Then c'est l'URL de la copie qui est utilisée.
- **AC-03-02**: Given une photo sans copie, When elle est affichée, Then l'URL
  d'origine est utilisée comme aujourd'hui, avec la même image de secours en cas
  d'erreur.
- **AC-03-03**: Given une URL de copie (stockage Supabase), When `RemotePoiImage` la
  rend, Then elle passe par `next/image` (optimiseur) en conservant `loading`,
  `fetchPriority`, les dimensions et l'image de secours.
- **AC-03-04**: Given une nouvelle copie créée, When elle est enregistrée, Then les
  pages publiques concernées sont revalidées pour l'afficher.

### US-04 — Créditer l'origine des photos

**As a** Product Owner
**I want to** que l'origine des photos soit citée sur la fiche
**So that** les établissements qui ont donné leur accord soient crédités

#### Acceptance Criteria

- **AC-04-01**: Given une fiche publique dont au moins une photo affichée provient d'un
  site tiers (copiée ou non), When elle s'affiche, Then le texte de présentation se
  termine par une ligne « Photos : <nom du POI> », placée après la description et avant
  les boutons d'action.
- **AC-04-02**: Given un POI dont `website` est renseigné, When la ligne de crédit
  s'affiche, Then le nom est un lien vers ce site (`rel="nofollow noopener"`, nouvel
  onglet). Sans `website`, le nom est affiché sans lien.
- **AC-04-03**: Given une fiche dont toutes les photos sont des photos MyStay (envoyées
  par l'admin ou le commerçant dans le stockage MyStay sans origine tierce), When elle
  s'affiche, Then aucune ligne de crédit n'apparaît.

---

## Business Rules

- **BR-01**: Toutes les photos des POI publiés sont copiées, sans autorisation
  enregistrée par POI (décision PO du 2026-10-05 : l'accord des établissements sera
  obtenu hors de l'outil).
- **BR-02**: `PointOfInterest.photos` n'est jamais modifié par la copie. La détection
  des liens morts, la réparation et l'import continuent d'opérer sur les URL d'origine.
- **BR-03**: Une URL déjà hébergée dans le stockage MyStay (hôte Supabase du projet)
  n'est jamais recopiée.
- **BR-04**: La copie n'est pas une donnée de référence : si elle manque ou échoue,
  l'affichage revient à l'URL d'origine, sans erreur visible.
- **BR-05**: Aucune suppression physique. Une copie obsolète (photo d'origine retirée
  du POI) reste en base ; elle n'est simplement plus utilisée, puisque la résolution
  part toujours de la liste `photos` courante.
- **BR-06**: La tâche quotidienne traite au plus 40 photos par exécution, par ordre de
  publication, pour rester sous la durée maximale d'une fonction.
- **BR-07**: Gemini n'intervient pas (ADR-006).

---

## Data Model

```prisma
model PoiPhotoMirror {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  poi_id      String
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])
  source_url  String
  storage_url String
  width       Int
  bytes       Int

  @@unique([poi_id, source_url])
  @@index([source_url])
}

// PointOfInterest : ajout de la relation inverse uniquement
//   photo_mirrors PoiPhotoMirror[]
```

Migration additive (nouvelle table, aucune colonne modifiée).

---

## API Contract

```yaml
openapi: 3.1.0
paths:
  /api/internal/poi-photo-mirrors/sync:
    get:
      summary: Tâche quotidienne de copie des photos des POI publiés (Vercel Cron)
      security:
        - bearerInternal: []   # Authorization: Bearer ${INTERNAL_API_SECRET}
      responses:
        "200":
          description: Lot traité
          content:
            application/json:
              schema:
                type: object
                required: [mirrored, skipped, failed]
                properties:
                  mirrored: { type: integer, minimum: 0 }
                  skipped: { type: integer, minimum: 0 }
                  failed: { type: integer, minimum: 0 }
        "401":
          description: Secret absent ou invalide
          content:
            application/json:
              schema:
                type: object
                required: [error]
                properties:
                  error:
                    type: object
                    required: [code, message]
                    properties:
                      code: { type: string, enum: [UNAUTHORIZED] }
                      message: { type: string }
                      details: { type: object }
components:
  securitySchemes:
    bearerInternal:
      type: http
      scheme: bearer
```

La route de publication existante (`PATCH /api/admin/pois/[id]/discovery-publication`)
garde exactement son contrat ; elle déclenche la copie en arrière-plan (`after()` de
Next.js) quand le statut devient `PUBLISHED`.

---

## Infrastructure

- `vercel.json` : nouvelle tâche `/api/internal/poi-photo-mirrors/sync`, planifiée à
  `15 4 * * *` (après le géocodage de 04:00).
- Script de reprise : `scripts/mirror-poi-photos.ts` (lancé une fois, traite tous les
  POI publiés par lots).
- Bucket `guide-photos` existant (public, WebP/AVIF, 5 Mo max) : les copies WebP
  redimensionnées restent sous cette limite.

---

## UI Behaviour

- Fiche publique `/decouvrir/[city]/[category]/[poi]` : ligne de crédit discrète dans
  le bloc de présentation, après la description, avant « Appeler / Itinéraire / Site
  officiel ». Style : texte secondaire de la fiche, taille réduite. Exemple :
  « Photos : Brasserie du Mont Blanc ».
- Aucune autre modification visuelle : les photos gardent leurs cadrages actuels.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Copie lancée en arrière-plan à la publication | integration |
| AC-01-02 | WebP ≤ 1 600 px stocké + ligne PoiPhotoMirror | unit |
| AC-01-03 | Copie idempotente | unit |
| AC-01-04 | Tâche quotidienne rattrape les photos manquantes | contract |
| AC-01-05 | Script de reprise des POI publiés | unit |
| AC-02-01 | Refus des URL non https | unit |
| AC-02-02 | Refus des hôtes privés / locaux | unit |
| AC-02-03 | Refus type, taille, durée, contenu indécodable | unit |
| AC-02-04 | Échec retenté au passage suivant | unit |
| AC-03-01 | Surfaces publiques et guide utilisent la copie | integration |
| AC-03-02 | Retour à l'original sans copie | unit |
| AC-03-03 | RemotePoiImage passe par next/image pour une copie | unit |
| AC-03-04 | Revalidation des pages après copie | unit |
| AC-04-01 | Ligne de crédit dans le texte de présentation | integration |
| AC-04-02 | Lien vers le site officiel ou nom seul | integration |
| AC-04-03 | Pas de crédit pour des photos MyStay | integration |

---

## Out of Scope

- Suivi des autorisations des établissements dans l'outil (case, date, preuve).
- Photos des commerçants et photos envoyées par l'admin, déjà stockées chez MyStay.
- Images Google Places via l'API (non utilisées par le pipeline actuel).
- Suppression des fichiers de copie obsolètes du stockage.
- Recadrage ou retouche des photos.

---

## Open Questions

Aucune.
