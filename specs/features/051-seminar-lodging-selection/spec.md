# Spec — 051 Sélection des logements pour les séminaires

## Metadata

```yaml
id: 051-seminar-lodging-selection
title: "Sélection Super-admin des logements diffusés sur les pages séminaires"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-01
depends_on: [028-lodging-showcase-seo, 031-public-marketing-site, 048-admin-local-landing-management]
```

## Context

Demande du Product Owner : ajouter dans `/admin/lodgings` une action permettant
de choisir les logements affichés sur `/seminaires` et sur la landing séminaire
de leur commune. La sélection ne doit pas dépendre du nom commercial du logement.
La correspondance locale repose sur la City associée au Lodging.

Approche proposée : un booléen sur Lodging pilote les deux surfaces, avec filtrage
par City pour la landing. Deux sélections indépendantes imposeraient des actions
redondantes ; une association plusieurs-à-plusieurs ne serait utile que pour une
diffusion sur plusieurs communes, hors de la demande.

## Glossary References

- **Admin**
- **Lodging**
- **Lodging Public Profile**
- **City**
- **Local Landing Page**
- **Soft Delete**

## User Stories

### US-01 — Choisir les logements diffusés

En tant que Super-admin, je peux ajouter ou retirer chaque logement de la
sélection Séminaires depuis la liste des logements.

### US-02 — Découvrir la sélection globale

En tant que visiteur de `/seminaires`, je vois les logements publics choisis.

### US-03 — Découvrir la sélection de la commune

En tant que visiteur de `/seminaires/[city-slug]`, je vois uniquement les
logements choisis appartenant à la City de cette landing publiée.

## Business Rules

- BR-01 : seul un Admin actif, authentifié et non supprimé modifie la sélection.
- BR-02 : aucun logement n'est sélectionné par défaut, y compris les existants.
- BR-03 : l'ajout et le retrait sont persistés et idempotents ; ils ne modifient
  ni le statut de publication de la fiche ni les autres champs du logement.
- BR-04 : la diffusion exige une sélection active, une fiche `published` non
  supprimée, un Lodging actif non supprimé et une City active non supprimée.
- BR-05 : la sélection peut être préparée avant publication. Une dépublication
  masque le logement sur les deux surfaces sans effacer le choix Admin ; sa
  republication le rend à nouveau visible si les autres conditions sont remplies.
- BR-06 : la landing filtre par `Lodging.city_id = landing.city.id`, jamais par
  comparaison approximative de noms ou proximité géographique.
- BR-07 : sélectionner un logement ne crée ni n'active une landing ; les règles
  et réponses 404 de la spec 048 restent applicables.
- BR-08 : la page globale présente tous les logements éligibles sélectionnés,
  même si leur landing locale n'est pas publiée. Aucun complément automatique
  avec des logements non sélectionnés ou d'autres communes n'est permis.
- BR-09 : sans résultat, le bloc est absent. Tri par titre public croissant puis
  identifiant ; pas de limite arbitraire ni de classement manuel.
- BR-10 : les cartes utilisent le titre public, la photo de couverture, la ville,
  la surface et le nombre de voyageurs enregistrés, ainsi qu’un lien vers `/logements/[lodging-slug]`. Aucune capacité de salle de réunion
  ou prestation séminaire n'est déduite de cette sélection.
- BR-11 : ajout/retrait et changements d'éligibilité revalident les pages
  séminaires concernées, y compris ancienne et nouvelle commune si déplacement.

## Data Model

Fragment ajouté au modèle existant ; ses UUID, timestamps et relations restent
inchangés. Migration additive, sans suppression ni modification des contenus.

```prisma
model Lodging {
  // Champs existants conservés.
  seminar_selected Boolean @default(false)
}
```

## API Contract

```yaml
openapi: 3.1.0
info: { title: Seminar lodging selection, version: 1.0.0 }
paths:
  /api/admin/lodgings/{id}/seminar-selection:
    patch:
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              required: [seminar_selected]
              properties:
                seminar_selected: { type: boolean }
      responses:
        '200':
          description: Sélection enregistrée
          content:
            application/json:
              schema:
                type: object
                additionalProperties: false
                required: [id, seminar_selected]
                properties:
                  id: { type: string, format: uuid }
                  seminar_selected: { type: boolean }
        '400': { description: VALIDATION_ERROR — UUID ou corps invalide }
        '401': { description: UNAUTHORIZED — session absente }
        '403': { description: FORBIDDEN — utilisateur non Admin ou inactif }
        '404': { description: LODGING_NOT_FOUND — logement absent ou supprimé }
        '500': { description: SEMINAR_SELECTION_FAILED — écriture impossible }
```

Paramètres et corps validés avec Zod. Toutes les erreurs utilisent
`{ "error": { "code": "...", "message": "...", "details": {} } }`.
Les lectures publiques restent des queries serveur, sans nouvelle API publique.
Les DTO de lecture admin existants ajoutent `seminar_selected: boolean`.

## UI Behaviour

- Chaque ligne de `/admin/lodgings` affiche le titre public avec le nom interne
  secondaire lorsqu'il diffère, pour identifier le logement sans ambiguïté.
- Bouton Shadcn/ui `Ajouter à la page Séminaires` si non sélectionné ; sinon
  `Retirer de la page Séminaires`, avec un indicateur de sélection visible.
- Une mention explique qu'un logement sélectionné n'est diffusé que si sa fiche
  est publiée ; le bouton permet aussi de préparer une fiche non publiée.
- Pendant l'enregistrement, le bouton est désactivé. Succès : état actualisé.
  Échec : état précédent conservé et erreur accessible affichée.
- Bloc `Le cadre idéal pour votre séminaire.` avant la section présentant le lieu
  sur `/seminaires`, et avant le CTA final sur la landing locale.
- Cartes cohérentes avec les cartes publiques existantes, grille responsive
  d'une colonne mobile, deux sur tablette et trois sur desktop, dès 375 px.
- Ajustement visuel demandé et approuvé en conversation le 2026-10-01 : reprendre
  exactement la hiérarchie du bloc « L’expérience MyStay » fourni en référence :
  `MarketingEyebrow` avec trait rose et surtitre `La sélection MyStay`, H2 gras
  34–40 px, interligne 1.02 et tracking -0.05em, largeur maximale 720 px.
  Introduction : « Découvrez notre sélection de logements pour prolonger les
  échanges et partager des moments en équipe, dans le cadre de votre séminaire. »
  Paragraphe slate-500 en 14 px, interligne 1.72, largeur 660 px et marge haute
  20 px. En-tête de largeur 760 px, séparé des cartes de 34 px puis 48 px dès sm.
  Cartes compactes dédiées, inspirées de `MarketingPropertyCard`, selon la
  référence et la demande complémentaire explicite du Product Owner : photo 4/3,
  fond blanc, arrondis 26 px, ombre douce atténuée
  (0 10px 24px -10px, slate à 12 %, ajustement PO du 2026-10-01), ville rose uppercase, titre public gras.
  Uniquement deux statistiques en une rangée : Surface et Voyageurs, avec icônes
  Scan et Users. Surface absente rendue « — ». Pas de description, chambres ni
  salles de bains. Les données viennent de `surface_m2` et `max_guests` existants.
  Même composant sur le hub et les landings locales.
- Aucun bloc vide, logement fictif, compteur de salle ou prix ajouté.

## Acceptance Criteria

| ID | Critère | Tests |
|---|---|---|
| AC-01 | Ajouter puis retirer persiste le booléen sans altérer publication ou contenu ; répétition idempotente | contract + integration |
| AC-02 | Auth absente/non Admin, corps invalide, UUID invalide, logement absent/supprimé refusés sans écriture | contract |
| AC-03 | Liste admin : nom public identifiable, bouton selon l'état, chargement, succès et erreur sans faux succès | integration |
| AC-04 | Hub : tous les logements sélectionnés éligibles, aucun non sélectionné, tri stable | unit + integration |
| AC-05 | Landing Saint-Gervais : uniquement logements choisis avec sa City ; logement d'une autre commune exclu | unit + integration |
| AC-06 | Brouillons, review, archives, logements/villes inactifs ou supprimés et profils supprimés exclus ; choix conservé après dépublication | unit + integration |
| AC-07 | Aucun résultat masque le bloc ; landing inactive reste 404 malgré une sélection | integration |
| AC-08 | Cartes compactes : titre, photo, ville, surface (ou —), voyageurs et lien public corrects ; parcours Admin → hub → landing → fiche sans débordement mobile | e2e |
| AC-09 | Mutations de sélection, publication, suppression et changement de ville invalident les surfaces concernées | unit |
| AC-10 | Migration initialise à false sans sélection automatique et conserve les données existantes | integration |

## Out of Scope

- Sélection indépendante pour le hub et chaque landing.
- Affichage dans une autre commune, même voisine.
- Création ou activation automatique des landings.
- Publication automatique des fiches, modifications par les Owners.
- Réservation, tarifs, disponibilités ou nouveaux services séminaire.
- Ordre manuel, sélection groupée et refonte des pages existantes.

## Open Questions

Aucune question ouverte. Spec approuvée explicitement par le Product Owner en
conversation le 2026-10-01.
