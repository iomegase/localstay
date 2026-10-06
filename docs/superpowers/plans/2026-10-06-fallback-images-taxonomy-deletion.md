# Plan — 074 Images de remplacement et suppression de taxonomie

1. Tests (TDD) : `tests/unit/fallback-images-taxonomy-deletion.AC-01.delete.test.ts`
   (reclassement sous-catégorie → catégorie, catégorie → Non classées, rien si 409).
2. `deleteSubCategory` / `deleteCategory` : `tx.fallbackImage.updateMany` dans la transaction.
3. `fallback_image_count` sur `AdminCategory` / `AdminSubCategory` (`_count.fallback_images`,
   catégorie = toutes les images non retirées de la catégorie).
4. Confirmation de suppression : ligne « N image(s) de remplacement … » (test jsdom).
5. Mise à jour des mocks des tests de suppression existants, traçabilité, suite complète, build.
