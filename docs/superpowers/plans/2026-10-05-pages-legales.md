# Pages légales MyStay — plan d'implémentation

Spec : 031 US-06, amendement approuvé par les décisions du PO du 5 octobre 2026.
Architecture : trois routes serveur et un composant de lecture commun dans
features/marketing ; texte éditorial statique, aucune mutation de données.

1. Créer LegalPage.tsx : MarketingShell, titre, résumé, sommaire par ancres,
   sections et navigation entre les trois documents.
2. Créer les routes mentions-legales, confidentialite et cgu : identité fournie,
   contenu basé sur l'audit docs/legal, metadata et canonical.
3. Ajouter leurs chemins au proxy marketing et au sitemap public.
4. Tester les contenus, la structure, les metadata, les liens footer, les chemins
   proxy/sitemap ; exécuter Jest ciblé, TypeScript et ESLint.
5. Vérifier les routes HTTP avec le serveur local, mettre à jour la traçabilité.

Limite : ce travail ne met pas en place la purge automatique. La politique
validée doit aussi être appliquée aux copies de messages dans la messagerie.
