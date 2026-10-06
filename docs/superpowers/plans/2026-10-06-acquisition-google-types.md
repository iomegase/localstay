# Plan — Spec 073 Acquisition guidée par les types Google

Spec : `specs/features/073-acquisition-google-types/spec.md` (approved, option A). Inline, TDD.

1. Données : `google_types` (Category, SubCategory), `primary_type` / `type_match` (candidat) ;
   migration additive + valeurs par défaut par slug ; taxonomie de référence mise à jour.
2. `lib/google-types.ts` (pur) : correspondance (exact + `*_suffixe`), plan de requêtes par type
   (type → sous-catégorie), libellés français.
3. `google-places.ts` : `includedType` + `strictTypeFiltering`, champs `primaryType` / `types`,
   repli texte si 400.
4. Pipeline : requêtes par type quand la catégorie en a ; `primary_type` / `type_match` à la création.
5. Revue : tri primary/unknown puis section repliée « Autres types (N) », badge de type.
6. Taxonomie admin : champ « Types Google » (catégorie + sous-catégorie), schémas Zod, requêtes.
7. Traçabilité, suite complète, build ; migration appliquée par le PO avant push.
