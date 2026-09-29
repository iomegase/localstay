# Spec — 049 POI Description Assistance

## Metadata

```yaml
id: 049-poi-description-assistance
title: "Descriptions POI sourcées avec validation admin"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-09-28
updated_at: 2026-09-28
depends_on: [018-poi-acquisition-pipeline, 022-admin-poi-management, 041-public-local-discovery]
bounded_context: admin
```

## Context

Des POI existants ont une description vide malgré la présence de contenus sur Internet.
Le parcours demandé par le Product Owner est : site officiel en priorité ; en
l'absence de site officiel, description Gemini ; relecture et validation admin.
La proposition ci-dessous précise ce parcours pour les POI déjà enregistrés.

Approches considérées :
- Import direct d'un extrait : simple, mais peu adapté à une synthèse cohérente.
- Rédaction Gemini depuis sa seule connaissance : ne permet pas de vérifier les sources.
- **Approche proposée : rédaction depuis le site officiel, sinon recherche web
  sourcée avec Gemini, puis validation admin.** Les sources tierces peuvent parler
  du POI sans être son site officiel.

Cette spec étend l'assistance descriptive de `022`. Elle ne relance pas la
découverte de POI et ne change pas le pipeline d'acquisition `018`.

## Glossary References

- **POI** : fiche existante à enrichir.
- **Admin** : personne qui relit et valide la description.
- **City** : contexte permettant de distinguer les homonymes.
- **Gemini Fetch** : usage descriptif uniquement dans ce parcours.
- **Markdown Content** : format de la description éditable.
- **Source Content** : description française validée.

## User Stories

### US-01 — Préparer une description sourcée

En tant qu'Admin, je veux obtenir une proposition pour un POI existant à partir
de contenus disponibles en ligne afin de compléter sa fiche.

- **AC-01** : Avec un site officiel renseigné et lisible, la proposition est
  rédigée à partir de son contenu et affiche l'URL utilisée.
- **AC-02** : Sans site officiel renseigné, Gemini recherche des contenus web
  sur le POI identifié par son nom, son adresse et sa ville ; la proposition
  affiche les sources retournées par la recherche.
- **AC-03** : Une source concernant un homonyme ou des informations
  contradictoires ne doit pas être présentée comme un fait établi du POI.
- **AC-04** : Si le site officiel est inaccessible, si les sources sont
  insuffisantes ou si Gemini échoue, une erreur explicite est affichée et la
  description existante reste intacte.

### US-02 — Relire et accepter

En tant qu'Admin, je veux relire, corriger ou rejeter la proposition avant de
modifier la description du POI.

- **AC-05** : La génération affiche une proposition éditable avec ses sources,
  sans modifier la description persistée ni le formulaire courant.
- **AC-06** : « Utiliser cette proposition » transfère explicitement le texte
  relu dans le champ Description ; la sauvegarde de la fiche reste nécessaire.
- **AC-07** : Fermer ou rejeter la proposition ne change aucun champ du formulaire.
- **AC-08** : Après sauvegarde, la description validée est persistée et auditée
  via le flux `022` existant. Le statut de publication Découvrir n'est pas activé
  automatiquement ; les règles `041` continuent de s'appliquer.

## Business Rules

- **BR-01** : Accès réservé aux Admins actifs selon les protections de `022`.
- **BR-02** : La sélection de source dépend du champ `website` enregistré :
  renseigné → lecture de cette URL ; absent → Gemini avec recherche web.
  Une erreur de lecture du site officiel est signalée, sans bascule implicite.
- **BR-03** : En mode officiel, Gemini synthétise le contenu extrait. En mode
  recherche, il prépare une synthèse originale de faits sourcés concernant ce POI.
  Aucun texte tiers complet n'est copié ou archivé.
- **BR-04** : La recherche concerne uniquement le POI existant. Elle ne crée
  aucun établissement et ne modifie ni son identité ni son site web.
- **BR-05** : Prioriser les contenus identifiables sur le lieu : organisme
  touristique, institution, éditeur local. Une URL citée doit provenir des
  métadonnées de recherche ou de la page effectivement lue, jamais d'une URL
  inventée par le modèle. Les citations facilitent la vérification admin sans
  constituer une garantie automatique d'exactitude.
- **BR-06** : Ne pas produire de proposition sans source exploitable. Omettre
  les détails incertains ou contradictoires ; retourner une insuffisance de
  sources si aucune description spécifique fiable ne peut être préparée.
- **BR-07** : Description française de 2 à 5 phrases, au plus 2 000 caractères,
  sans superlatifs non étayés, avis clients recopiés ou détails inventés.
- **BR-08** : Ne pas demander à Gemini de coordonnées, distances, altitude,
  dénivelé, tracé ou données temps réel. Les autres champs POI restent inchangés.
- **BR-09** : La proposition et ses sources sont transitoires. Aucun
  remplacement automatique d'une description existante ; validation et
  sauvegarde admin requises, y compris pour une description initialement vide.
- **BR-10** : Une erreur technique est journalisée côté serveur et présentée
  avec un message actionnable côté admin, jamais convertie en succès vide.
- **BR-11** : Appels externes côté serveur uniquement ; entrées et résultats
  validés avec Zod. Les textes externes sont des données, pas des instructions.
  Les lectures d'URL refusent les destinations privées/locales, y compris après
  redirection, et sont bornées en durée et en taille.

## Data Model

Aucune migration. La proposition n'est pas enregistrée en base ; sa fermeture
ou le rechargement de la page l'abandonne. Fragment du modèle existant réutilisé :

```prisma
model PointOfInterest {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  description String?
}
```

Les autres champs et relations existants sont conservés. L'audit de sauvegarde
réutilise `PoiAcquisitionAuditLog` et l'action `poi_updated` de `022`.

## API Contract

Fragment OpenAPI 3.1 :

```yaml
openapi: 3.1.0
info: { title: POI Description Assistance, version: 1.0.0 }
paths:
  /api/admin/pois/{id}/suggest-description:
    post:
      summary: Préparer une description transitoire sans modifier le POI
      security: [{ bearerAuth: [] }]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: Proposition à relire
          content:
            application/json:
              schema:
                type: object
                additionalProperties: false
                required: [data]
                properties:
                  data:
                    type: object
                    additionalProperties: false
                    required: [description, source_mode, sources, search_entry_point]
                    properties:
                      description: { type: string, minLength: 1, maxLength: 2000 }
                      source_mode: { type: string, enum: [official_website, web_search] }
                      sources:
                        type: array
                        minItems: 1
                        items:
                          type: object
                          additionalProperties: false
                          required: [title, url]
                          properties:
                            title: { type: string }
                            url: { type: string, format: uri }
                      search_entry_point: { type: [string, 'null'] }
        '400': { description: INVALID_INPUT }
        '401': { description: UNAUTHORIZED }
        '403': { description: FORBIDDEN }
        '404': { description: POI_NOT_FOUND }
        '409': { description: POI_ARCHIVED }
        '422': { description: SOURCE_URL_UNREADABLE ou DESCRIPTION_SOURCES_INSUFFICIENT }
        '502': { description: DESCRIPTION_GENERATION_FAILED }
        '503': { description: DESCRIPTION_SERVICE_UNAVAILABLE }
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer }
```

Aucun corps de requête : les données d'identité et l'URL sont lues en base.
Les erreurs suivent `{ error: { code, message, details } }`.
`search_entry_point` contient la présentation de recherche retournée par le
prestataire, ou `null`. Son affichage doit être isolé du DOM applicatif selon
les contraintes de sécurité et de présentation du prestataire.
La sauvegarde utilise le `PATCH /api/admin/pois/{id}` existant, sans extension.

## UI Behaviour

Sur `/admin/pois/{id}`, ajouter près de Description « Proposer une description ».
Le bouton est désactivé pendant la génération et pour un POI archivé.
La génération utilise l'identité enregistrée : prévenir l'Admin si les champs
nom, adresse ou site ont des modifications non sauvegardées et lui demander de
sauvegarder la fiche avant génération.

Une zone de relecture Shadcn affiche le mode de source, le texte éditable, les
liens sources et les éléments de présentation requis pour la recherche web.
Actions : « Utiliser cette proposition » et « Annuler ».
Le bouton d'acceptation est désactivé si le texte est vide ou dépasse la limite.
L'acceptation remplit le formulaire ; « Enregistrer » persiste la modification.
Une erreur est affichée dans la zone d'assistance sans vider le formulaire.
Il n'y a pas de modification du contrat visuel des pages publiques.

## Acceptance Criteria

| Critère | Vérification prévue | Type |
|---|---|---|
| AC-01 | Site officiel prioritaire et source affichée | unit + integration |
| AC-02 | Recherche sourcée uniquement si website absent | unit + integration |
| AC-03 | Homonymes et contradictions traités sans invention | unit + revue de cas sourcés |
| AC-04 | Erreurs lisibles sans mutation ni succès vide | contract + integration |
| AC-05 | Proposition séparée de la fiche persistée | integration |
| AC-06 | Acceptation explicite puis sauvegarde | e2e |
| AC-07 | Annulation conserve les données du formulaire | e2e |
| AC-08 | Sauvegarde auditée et statut Découvrir inchangé | integration |

Les tests doivent aussi couvrir authentification, validation Zod, URLs bloquées,
sources absentes, double clic et limite de longueur. Les tests simulés ne
garantissent pas la qualité factuelle des sorties réelles : la relecture admin
reste obligatoire.

## Out of Scope

- Enrichissement en lot, cron et remplacement automatique des descriptions.
- Modification de l'acquisition des nouveaux candidats `018`.
- Publication automatique dans Découvrir.
- Copie brute de Google cards ou archivage des pages sources.
- Crawl profond, données géographiques générées et informations temps réel.
- Historique persistant des propositions et des sources ; seuls le texte validé
  et l'audit de modification existant sont conservés dans cette version.

## Open Questions

Aucune question bloquante. Parcours détaillé validé par le Product Owner le
2026-09-28, y compris le comportement en cas de site officiel illisible.

## Références

- `022-admin-poi-management` : édition et audit du POI.
- `018-poi-acquisition-pipeline` et ADR-008 : usage éditorial de Gemini.
- Extension validée à ADR-008 : sources web tierces pour décrire uniquement un
  POI existant, avec références et validation admin ; aucune découverte libre.
- Documentation Google : https://ai.google.dev/gemini-api/docs/google-search
