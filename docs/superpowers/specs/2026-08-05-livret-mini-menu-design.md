# Mini top-menu de navigation du livret logement

Date : 2026-08-05

## Contexte

Le livret d'accueil privé (`/sejour/logement`, rendu par `GuideLodgingViews`) a un
hub et 4 sous-pages : `arrival`, `practical`, `rules`, `departure`. Pour passer de
l'une à l'autre, il faut aujourd'hui revenir au hub via le bouton `← Guide logement`.

## Objectif

Ajouter un mini-menu (segmented control) en haut des 4 sous-pages permettant de
sauter directement d'une catégorie à l'autre, sans repasser par le hub.

## Décisions

- **Portée** : uniquement les 4 sous-pages, pas le hub.
- **Bouton retour** : le mini-menu **remplace** le bouton `← Guide logement`.
  Retour au hub = logo mystay / onglet Guide (inchangé).
- **Libellés / ordre** (= parcours du séjour) :

  | Pilule    | Vue         | Icône (déjà importée) |
  |-----------|-------------|-----------------------|
  | Accès     | `arrival`   | `KeyRound`            |
  | Infos     | `practical` | `Wifi`                |
  | Consignes | `rules`     | `ScrollText`          |
  | Départ    | `departure` | `LogOut`              |

## Design

Nouveau composant `GuideLodgingTabs` rendu par `GuideSubPage`, sticky en haut du
conteneur scrollable.

- Rangée pleine largeur `grid-cols-4`, sticky `top-0 z-10`, fond blanc.
- Pilule active : fond `pink-600`, texte blanc. Inactive : `slate-100` / `slate-500`.
- Icône ~14px + libellé court. `aria-current="page"` sur la pilule active.
- Tap → `onNavigate(view)` (déjà câblé dans `GuideApp`, bascule de vue instantanée).

## Impact code

- `GuideSubPage` reçoit `view` + `onNavigate` au lieu de `onBack`.
- Les 4 branches de `GuideLodgingViews` passent déjà `onNavigate` ; on remplace
  `onBack={() => onNavigate('lodging')}` par `view` + `onNavigate`.
- Purement présentation : aucun changement de données ni d'API.

## Tests

- Rendu des 4 pilules avec les bons libellés sur une sous-page.
- La pilule correspondant à la vue courante porte `aria-current="page"`.
- Un clic sur une autre pilule appelle `onNavigate` avec la bonne vue.
