# Navigation basse fluide — Implementation Plan

Objectif : appliquer le visuel validé par le PO, sans rose (spec 054 AC-01-01).

1. Modifier `GuideNavigation.tsx` : cœur accessible sans texte, quatre colonnes,
   barre aux coins supérieurs droits, ombre vers le haut, pastille unique animée en 350 ms.
2. Définir l’étirement de la pastille dans `tailwind.config.ts` ; utiliser les
   utilitaires motion-safe/motion-reduce pour respecter les préférences système.
3. Mettre à jour les tests de navigation privé/démo : nom « Coups de cœur »,
   destination favorites conservée, état actif sur sous-pages et remplissage.
4. Exécuter les suites concernées et ESLint ; actualiser la traçabilité.

Le composant est partagé entre la démo et le privé. Aucune donnée/API ne change.
