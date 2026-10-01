# Import multiple et catégories des photos

Objectif : appliquer la demande approuvée et le choix A dans la spec 028, AC-05-13 à AC-05-15.

- [x] Étendre `lib/photo-categories.ts` avec Salon et compatibilité des catégories existantes.
- [x] Ajouter un PUT validé par Zod sur les routes photo Owner/Admin et une mutation limitée à la catégorie dans `queries/owner-public-profile.ts` ; conserver PATCH couverture.
- [x] Isoler les envois séquentiels dans `lib/upload-photos.ts` ; progression, conservation des succès et reprise des échecs.
- [x] Modifier `components/LodgingShowcaseForm.tsx` : import multiple et sélecteur par photo, blocage des mutations concurrentes.
- [x] Tests après code selon AGENTS.md : catégories, formulaire, API et isolation de la mutation ; exécuter Jest ciblé, TypeScript et ESLint.
- [x] Mettre à jour `docs/traceability-matrix.md`.

Validation : 56 tests ciblés réussis ; TypeScript et ESLint réussis. Suite élargie : 149 tests réussis, un test SEO préexistant en échec (`lodging-showcase.metadata.test.ts` attend « Nos logements », le code HEAD renvoie le titre SEO Mont-Blanc). Revue : verrouillage indépendant pendant les envois et mutations de catégorie, couvert par un test avec requête différée.
