# Fiabiliser les imports randonnée

Spec approuvée : 019, AC-01-06/07/08 et règles existantes Gemini.

- [x] Borner les sources et phases (210 s global, 65 s découverte, 35 s enrichissement), découverte parallèle.
- [x] Checkpoint des candidats après découverte puis phases ; identifiants stables et comparaison updated_at pour protéger les modifications admin.
- [x] Clôture des exceptions et imports inactifs depuis 10 minutes, sans suppression.
- [x] Configurer route 300 s et retour explicite en cas de perte de connexion.
- [x] Respecter le périmètre Gemini existant : découverte et description seules, ne pas enrichir une métrique absente via Gemini.
- [x] Tests des délais, checkpoints, interruption et concurrence ; TypeScript et lint.
- [x] Récupération ciblée des deux runs et acquisition de candidats à revoir ; ne rien publier automatiquement.

## Résultat vérifié le 30 septembre 2026

- Combloux : run `e2084630-a1c9-4089-abd4-619be7e76cc9`, 17 candidats `needs_review`, statut `partial_success` (délais Overpass et descriptions Gemini).
- Saint-Gervais-les-Bains : run `386cff57-18a9-456f-a839-e1cfd4410d60`, 31 candidats `needs_review`, statut `partial_success` (2 enrichissements de durée en échec et délai descriptions Gemini).
- Statuts et compteurs confirmés par une lecture indépendante en base. Aucune publication automatique.
- Validation : 15 suites Jest / 49 tests réussis, TypeScript réussi, ESLint sans erreur (2 avertissements préexistants), diff sans erreur d'espacement.
- Récupération exécutée avec le code local corrigé ; correctif permanent non déployé.
