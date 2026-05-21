# Traceability Matrix — StayLocal MVP 1

> Ce document fait le lien entre chaque critère d'acceptation (spec),
> le fichier source correspondant, et le fichier de test.
> Il doit être mis à jour après chaque implémentation.

---

## Légende

| Statut | Signification |
|---|---|
| ⬜ not started | Spec approuvée, code non démarré |
| 🔵 in progress | Code en cours |
| ✅ done | Code + tests livrés |
| ❌ blocked | Bloqué (open question non résolue) |

---

## 001 — City Guide

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Scan QR → redirection < 3s | - | - | ⬜ |
| AC-01-02 | Slug inexistant → 404 | - | - | ⬜ |
| AC-01-03 | Nom ville + nb catégories affichés | - | - | ⬜ |
| AC-02-01 | Saisie ville valide → redirection | - | - | ⬜ |
| AC-02-02 | Saisie sans résultat → message | - | - | ⬜ |
| AC-02-03 | Autocomplétion dès 3 caractères | - | - | ⬜ |
| AC-03-01 | Seules catégories avec POI visibles | - | - | ⬜ |
| AC-03-02 | Icône + nom + count par catégorie | - | - | ⬜ |
| AC-03-03 | Rendu lisible 375px | - | - | ⬜ |

---

## 002 — Categories

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Seules catégories avec POI affichées | - | - | ⬜ |
| AC-01-02 | Catégorie vide absente du DOM | - | - | ⬜ |
| AC-01-03 | Icône + nom + count visibles | - | - | ⬜ |
| AC-02-01 | Clic → redirection category page | - | - | ⬜ |
| AC-02-02 | Sous-catégories affichées comme filtres | - | - | ⬜ |
| AC-03-01 | Filtre sous-catégorie fonctionne | - | - | ⬜ |
| AC-03-02 | Désélection filtre → tous POI | - | - | ⬜ |

---

## 003 — POI List

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Tri par distance par défaut | - | - | ⬜ |
| AC-01-02 | Card affiche tous les champs requis | - | - | ⬜ |
| AC-01-03 | POI fermé visuellement différencié | - | - | ⬜ |
| AC-02-01 | Tri par note fonctionne | - | - | ⬜ |
| AC-02-02 | Filtre sous-catégorie fonctionne | - | - | ⬜ |
| AC-02-03 | Suppression filtre → reset liste | - | - | ⬜ |
| AC-03-01 | Clic card → redirection fiche POI | - | - | ⬜ |

---

## 004 — POI Detail

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Tous champs visibles si présents | - | - | ⬜ |
| AC-01-02 | Bouton Appeler masqué si pas de tel | - | - | ⬜ |
| AC-01-03 | Bouton Site masqué si pas de site | - | - | ⬜ |
| AC-01-04 | Badge Ouvert avec heure fermeture | - | - | ⬜ |
| AC-02-01 | Bouton Appeler → `tel:` link | - | - | ⬜ |
| AC-02-02 | Bouton Itinéraire → Mapbox | - | - | ⬜ |
| AC-02-03 | Bouton Site → nouvel onglet | - | - | ⬜ |
| AC-02-04 | Bouton Partager → Web Share API | - | - | ⬜ |
| AC-03-01 | Bloc randonnée si hiking_detail | - | - | ⬜ |
| AC-03-02 | Tracé Mapbox si gpx_url | - | - | ⬜ |

---

## 005 — Map

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Carte avec markers au clic | - | - | ⬜ |
| AC-01-02 | Carte centrée sur City | - | - | ⬜ |
| AC-01-03 | Clustering si markers proches | - | - | ⬜ |
| AC-02-01 | Clic marker → popup | - | - | ⬜ |
| AC-02-02 | Clic "Voir la fiche" → fiche POI | - | - | ⬜ |
| AC-02-03 | Clic hors popup → fermeture | - | - | ⬜ |
| AC-03-01 | Mini-carte visible dans fiche | - | - | ⬜ |
| AC-03-02 | Mini-carte non-interactive | - | - | ⬜ |

---

## 006 — QR Code

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Scan → `/guide/[city-slug]` | - | - | ⬜ |
| AC-01-02 | Pas d'étape intermédiaire | - | - | ⬜ |
| AC-01-03 | Rendu iOS et Android correct | - | - | ⬜ |
| AC-02-01 | QR code PNG avec bonne URL | - | - | ⬜ |
| AC-02-02 | PNG 1000×1000px minimum | - | - | ⬜ |
| AC-02-03 | Lisible imprimé 10×10cm | - | - | ⬜ |

---

## 007 — Gemini Fetch

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Fetch si cache absent ou expiré | - | - | ⬜ |
| AC-01-02 | POI structurés et persistés | - | - | ⬜ |
| AC-01-03 | Cache valide → pas de fetch | - | - | ⬜ |
| AC-02-01 | Établissements fermés exclus | - | - | ⬜ |
| AC-02-02 | Doublons dédupliqués | - | - | ⬜ |
| AC-02-03 | POI sans nom/adresse exclus | - | - | ⬜ |
| AC-02-04 | POI hors périmètre exclus | - | - | ⬜ |
| AC-03-01 | Cache expiré → nouveau fetch | - | - | ⬜ |
| AC-03-02 | Pas de double fetch simultané | - | - | ⬜ |
| AC-03-03 | Fetch échoué → cache expiré servi | - | - | ⬜ |
