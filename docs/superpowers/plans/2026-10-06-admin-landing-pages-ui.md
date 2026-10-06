# Plan — 076 Refonte UI Admin Landing pages

1. Query `getAdminLandingDestinationBySlug` + route `src/app/admin/landing-pages/[citySlug]/page.tsx` (notFound).
2. `lib/landing-editor.ts` (pur) : blocs par intention, compteurs SEO, « à compléter » par champ, onglet ↔ `?onglet=`, état modifié.
3. Liste : `AdminLandingPages` simplifiée (pastilles cliquables, Modifier = lien, Ajouter → redirection) ; avis retirés de la liste.
4. Page ville : `AdminLandingCityEditor` (en-tête, interrupteur, onglets, barre fixe, beforeunload) + `LandingPageEditor` en blocs (aperçu Google, compteurs, champs à compléter) + onglet Avis.
5. Mise à jour des tests 047/048 (liste, éditeur, avis), nouveaux tests 076, traçabilité, suite, build.
