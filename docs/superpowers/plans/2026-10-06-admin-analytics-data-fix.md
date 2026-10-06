# Plan — 075 Admin Analytics : des données justes

1. `lib/private-paths.ts` (BR-01) + `city-path-mapping.ts` (US-03) — TDD unitaire.
2. GA4 : `dimensionFilter` sur les 3 rapports, soft delete des lignes privées (US-02 serveur) ;
   `GoogleAnalyticsClient` : `ga-disable-<ID>` selon le chemin (US-02 client).
3. Synchro : sources = GA4 + GSC ; schéma Zod sans Vercel (US-01).
4. Requêtes dashboard : agrégation par page / requête / ville (US-04) ; statuts GA4 + GSC.
5. Page : retrait Live + Core Web Vitals, encart « voir dans Vercel ».
6. Mise à jour des tests 030 impactés, traçabilité, suite complète, build ; resynchro manuelle.
