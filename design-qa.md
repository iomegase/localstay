# Design QA — découverte du guide de démonstration

- Source visual truth: captures du guide privé fournies par le Product Owner dans la conversation
- Implementation: `src/features/guide-demo/components/DemoFavoritesView.tsx`, `src/features/guide-demo/components/DemoPoiDetailView.tsx`
- Viewport cible: mobile, cadre du guide de démonstration
- Source pixels: captures conversationnelles, dimensions non normalisées localement
- Implementation pixels: indisponibles
- CSS size: cadre du modal existant
- Density normalization: non réalisée
- State: onglet Coups de cœur, filtre Tous, puis fiche POI Rond de Carotte

## Full-view comparison evidence

La structure des composants de référence privés a été reproduite dans la démo. La capture navigateur de l’implémentation n’a pas pu être obtenue : ni le navigateur intégré ni son navigateur de secours ne sont disponibles dans cette session.

## Focused region comparison evidence

Bloquée pour la même raison. Les tests vérifient néanmoins les filtres sticky, les proportions bento, les rayons et les statuts des favoris, ainsi que la typographie sans serif, la distance compacte, la grille d’actions 2×2 et le bouton Carte MyStay de la fiche POI.

## Findings

- Aucun défaut fonctionnel détecté par les tests ciblés.
- Comparaison visuelle pixel à pixel bloquée faute de navigateur disponible.

## Comparison history

- Itération 1 : remplacement de l’ancienne présentation éditoriale par la structure visuelle du composant privé existant.
- Itération 2 : alignement de la fiche POI sur la feuille, la typographie et les actions du composant privé existant.
- Vérification automatisée : 47 tests ciblés, lint ciblé, lint global et build réussis. Les avertissements du lint global sont antérieurs à cette modification.

final result: blocked
