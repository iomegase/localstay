# Spec — 061 Guide privé bilingue FR / EN

## Metadata

```yaml
id: 061-private-guide-i18n
title: "Guide privé en français et en anglais, sélecteur FR / GB dans l'en-tête"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-04
updated_at: 2026-10-04
depends_on:
  - 027-multilingual-content
  - 054-private-guide-stay-redesign
  - 059-guide-pwa
bounded_context: guide-app
implementation_gate: "Décisions du PO du 2026-10-04 : traduire l'interface et le contenu saisi par l'hôte (DeepL, spec 027) ; mémoriser la langue dans un cookie technique ; langue par défaut = langue du téléphone ; sélecteur FR / GB dans l'en-tête. Mise en œuvre en deux phases."
i18n_source_locale: fr
i18n_target_locales: [en]
```

## Context

Le guide privé (`/sejour`) n'existe qu'en français alors qu'une partie des
voyageurs est étrangère. La spec 027 définit l'architecture multilingue du site
public (routes `/{locale}/…`, DeepL, `ContentTranslation`) mais n'est pas
implémentée et ne couvre pas le guide privé, qui n'a pas d'URL indexable.

Cette spec rend le guide privé bilingue français / anglais en réutilisant les
choix de 027 (clés i18n pour l'interface, DeepL côté serveur pour le contenu
vivant, français source, repli sur le français), sans préfixe de langue dans
l'URL.

## Glossary References

- **Guide privé**, **Lodging**, **LodgingCustomization**, **LodgingArrivalInstruction**.
- **UI string**, **Source Content**, **ContentTranslation**, **TranslationFieldPolicy**,
  **fallback_source** (spec 027).

## User Stories

### US-01 — Choisir sa langue (phase 1)

En tant que voyageur, je veux passer le guide en anglais ou en français d'un
geste, pour comprendre les informations de mon séjour.

- **AC-01-01**: Given le guide privé, When l'en-tête s'affiche, Then un
  sélecteur « FR | GB » est visible entre le logo et le menu ; la langue active
  est mise en avant par une pastille qui glisse.
- **AC-01-02**: Given le sélecteur, When le voyageur touche « GB » (ou « FR »),
  Then toute l'interface du guide bascule dans cette langue sans rechargement
  complet ni changement d'URL, et le cookie `staylocal_locale` (`fr` | `en`,
  180 jours, `SameSite=Lax`, `Secure` en production, sans donnée personnelle —
  cookie de 027 AC-01-01) est écrit.
- **AC-01-03**: Given une première visite sans cookie, When le guide est servi,
  Then la langue est déduite de l'en-tête `Accept-Language` : `fr` si la langue
  préférée commence par `fr`, sinon `en` ; sans en-tête, `fr` (langue source).
- **AC-01-04**: Given le cookie `staylocal_locale`, When une page du guide est
  servie, Then elle est rendue côté serveur directement dans cette langue (pas
  de clignotement) ; le conteneur du guide porte l'attribut `lang` dès le rendu
  serveur et `<html lang>` est synchronisé côté client (le layout racine reste
  statique pour le site public).
- **AC-01-05**: Given la langue `en`, When l'interface s'affiche, Then tous les
  libellés fixes du guide (navigation, titres d'écran, boutons, états vides,
  modales, PWA, numéros d'urgence, consignes de départ fixes, dates et heures)
  sont en anglais ; aucune chaîne française codée en dur ne subsiste dans les
  composants du guide privé.
- **AC-01-06**: Given le sélecteur, When il est utilisé au clavier ou au lecteur
  d'écran, Then il se comporte comme un groupe de 2 boutons radio nommés
  « Français » et « English », zone tactile ≥ 44 px.

### US-02 — Lire le contenu de l'hôte en anglais (phase 2)

- **AC-02-01**: Given un texte saisi par l'hôte en français (champs listés en
  BR-04), When il est créé ou modifié, Then une traduction anglaise est
  demandée à DeepL de façon asynchrone (027 BR-21) ; l'enregistrement de l'hôte
  n'est jamais bloqué.
- **AC-02-02**: Given la langue `en` et une traduction publiable à jour
  (027 BR-16, policy `auto_publish`), When le guide s'affiche, Then le texte
  anglais est montré ; sinon le texte français est affiché (027 BR-18), sans
  décalage de mise en page.
- **AC-02-03**: Given un texte source modifié, When la synchronisation s'exécute,
  Then seule la traduction de ce champ est marquée `stale` puis régénérée
  (027 AC-02-01 / BR-06).
- **AC-02-04**: Given les logements existants, When la tâche de rattrapage
  s'exécute (cron déclaré dans `vercel.json`, 027 BR-26), Then les champs sans
  traduction sont mis en file, par lots.

## Business Rules

- **BR-01**: Locales du guide privé : `fr` (source) et `en`. Le sélecteur
  affiche « FR » et « GB » (drapeau britannique = anglais) ; noms accessibles
  « Français » / « English ».
- **BR-02**: Pas de préfixe de langue ni de paramètre `?lang=` sur `/sejour`
  (dérogation à 027 BR-08, valable uniquement pour le guide privé non indexé).
- **BR-03**: Interface : chaînes dans des dictionnaires typés par clés dans le
  code (027 BR-03), jamais dans `ContentTranslation`. Une clé manquante en `en`
  fait échouer le typecheck.
- **BR-04**: Contenu hôte traduisible (027 BR-30) : `LodgingCustomization`
  (`welcome_message`, `parking_info`, `equipment_info`, `checkout_instructions`,
  `trash_info`, `trash_location`, `house_rules`, `useful_services`) et
  `LodgingArrivalInstruction` (`title`, `text`). Jamais traduits : Wi-Fi, code de
  boîte à clés, adresses, téléphones, URLs, noms de lieux et de logement (027 BR-11/12).
- **BR-05**: Traductions DeepL uniquement côté serveur via l'adaptateur
  `translation-provider` ; `DEEPL_API_KEY` et `DEEPL_API_BASE_URL` en variables
  serveur (027 BR-22 à BR-24). Gemini n'est pas utilisé (ADR-006).
- **BR-06**: Aucune donnée personnelle n'est envoyée à DeepL : seuls les textes
  de l'hôte listés en BR-04 le sont.
- **BR-07**: Le cookie de langue est un cookie technique de préférence ; il
  n'alimente aucun outil d'analyse.
- **BR-08**: Fiches de lieux (POI), carte, agenda, navettes : textes de contenu
  en français (hors périmètre, 027) ; seuls leurs libellés d'interface sont traduits.

## Data Model

Phase 1 : aucun changement.

Phase 2 : tables `ContentTranslation`, `TranslationJob`, `TranslationFieldPolicy`,
`TranslationAuditLog` telles que définies par la spec 027 (Data Model), avec les
policies `auto_publish` / `fallback_source` pour les champs de BR-04. Aucun autre
changement de schéma.

## API Contract

Phase 1 :

```yaml
/api/guide/locale:
  put:
    requestBody:
      content:
        application/json:
          schema: { type: object, required: [locale], properties: { locale: { enum: [fr, en] } } }
    responses:
      '204': { description: "Cookie staylocal_locale écrit" }
      '400':
        content:
          application/json:
            schema: { error: { code: INVALID_LOCALE, message: string, details: {} } }
```

Phase 2 : endpoint cron interne `/api/internal/translations/sync` (027 API
Contract, `POST`, protégé par `CRON_SECRET`), déclaré dans `vercel.json`.

## UI Behaviour

Sélecteur dans `GuideHeader`, entre le logo et le menu burger :

- Capsule 72 × 32 px, fond `slate-100`, bord `slate-200` ; deux libellés « FR »
  et « GB » 11 px / 600 ; pastille blanche avec ombre légère sous la langue
  active, qui glisse en 200 ms (sans animation si mouvement réduit).
- Toucher l'autre libellé ou glisser la pastille change de langue.
- Pendant le changement, l'interface bascule immédiatement côté client, puis le
  contenu serveur (textes de l'hôte) est rafraîchi.
- Démo (spec 045) : sélecteur absent (hors périmètre).

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01, AC-01-06 | integration |
| AC-01-02 | contract + integration |
| AC-01-03, AC-01-04 | unit (résolution de la langue) + integration |
| AC-01-05 | unit (complétude des dictionnaires, typecheck) + integration |
| AC-02-01 à AC-02-04 | unit + contract + integration (DeepL simulé) |

## Out of Scope

- Autres langues (it, es, nl) ; site public, démo, fiches de lieux, agenda.
- Traduction des messages de contact et des réponses.
- Revue humaine des traductions (policy `review_required`).

## Open Questions

| ID | Question | Statut |
|---|---|---|
| OQ-01 | Phase 2 : budget DeepL API Pro et création de la clé `DEEPL_API_KEY` sur Vercel. | pending — bloque la phase 2 uniquement |
