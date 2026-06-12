# ADR-009 — Gemini pour l'assistance éditoriale des fiches logement

## Statut

`accepted`

---

## Contexte

`ADR-006` limite Gemini dans le contexte POI : découverte contrôlée et descriptif, sans données géographiques mesurables. Cette décision reste valide pour les POI, les randonnées, les commerces, les restaurants et les données factuelles du Guide.

Le chantier `028-lodging-showcase-seo` ouvre un autre métier : la mise en valeur éditoriale de logements fournis par des Owners. Dans ce contexte, l'Owner peut coller un texte issu de sa propre annonce Airbnb ou Booking, téléverser ses photos, confirmer qu'il possède les droits nécessaires, puis demander une réécriture au ton MyStay.

Ce besoin ne relève pas de l'acquisition de POI. Il relève de l'assistance rédactionnelle sur un contenu explicitement fourni par l'Owner.

---

## Décision

Gemini peut être utilisé pour l'assistance éditoriale des fiches logement, uniquement dans le bounded context `lodging`, et uniquement à partir de données fournies ou validées par l'Owner et déjà présentes dans MyStay.

Usages autorisés :

1. réécrire un texte source fourni par l'Owner en version MyStay plus premium, locale et SEO ;
2. proposer un `short_description`, une `description`, un `seo_title` et une `seo_description` ;
3. reformuler le style, clarifier la structure et améliorer la lisibilité ;
4. suggérer des textes alternatifs de photos à partir d'une description fournie par l'Owner ou du `room_type` ;
5. intégrer un angle local à partir de données MyStay déjà validées : City, Guide, POI publiés, recommandations Owner.

Usages interdits :

- scraper Airbnb, Booking ou toute autre plateforme ;
- télécharger automatiquement des photos depuis une annonce externe ;
- copier ou publier automatiquement un texte externe sans confirmation de droits ;
- inventer des équipements, une capacité, des chambres, des lits, une surface, une adresse, des coordonnées, des prix, des disponibilités, des règles ou des conditions ;
- calculer des distances, coordonnées ou métriques géographiques ;
- produire des données transactionnelles : prix, calendrier, disponibilité, taxes, frais, annulation ;
- publier une fiche sans acceptation Owner puis validation Admin ;
- remplacer le système de traduction `027-multilingual-content`, qui reste basé sur DeepL API Pro pour la traduction de contenu vivant.

Le résultat Gemini est toujours un brouillon éditorial. Il doit être accepté par l'Owner, sauvegardé en `draft`, puis validé par le Super-admin avant publication.

---

## Options considérées

### Option A — Interdire Gemini sur les logements
- ✅ Risque légal et éditorial minimal
- ✅ Cohérence stricte avec une lecture large de `ADR-006`
- ❌ Expérience Owner plus laborieuse
- ❌ Moins de qualité SEO/GEO sur des annonces souvent pauvres ou peu différenciées

### Option B — Autoriser Gemini pour la réécriture éditoriale Owner (retenu)
- ✅ Sépare clairement le métier POI du métier logement
- ✅ Améliore la qualité des fiches sans automatiser la collecte
- ✅ Garde l'Owner responsable de la source et des droits
- ✅ Garde l'Admin responsable de la publication
- ✅ Compatible avec les règles anti-scraping et la validation humaine

### Option C — Utiliser Gemini pour importer automatiquement les annonces Airbnb
- ✅ Création de fiche très rapide
- ❌ Risque de scraping non autorisé
- ❌ Risque de copie de contenus tiers sans droits
- ❌ Risque d'hallucination ou d'invention de faits logement
- ❌ Risque de confusion avec une intégration officielle Airbnb

---

## Justification

Les POI et les logements sont deux métiers distincts :

- pour les POI, Gemini peut aider à découvrir ou décrire des lieux, mais ne doit pas produire de données factuelles mesurables ;
- pour les logements, l'existence du bien, ses photos, ses équipements et son texte source viennent de l'Owner. Gemini sert uniquement à améliorer la rédaction d'un contenu que l'Owner a fourni et dont il confirme les droits.

Cette séparation permet d'obtenir une expérience Owner efficace sans ouvrir la porte à l'import automatisé non contrôlé ni à la génération de faits.

---

## Conséquences

- La spec `028-lodging-showcase-seo` peut utiliser Gemini comme provider de réécriture éditoriale logement.
- Le flux doit stocker le texte source, le hash source, le provider, la date de génération et la suggestion.
- Le prompt Gemini doit lister explicitement les faits fournis et interdire toute invention.
- La réponse Gemini doit être validée avec Zod avant sauvegarde.
- La suggestion ne peut jamais passer directement en `published`.
- Les photos restent téléversées par l'Owner ; Gemini ne récupère pas d'images.
- L'URL Airbnb ou Booking reste un lien externe et une source déclarée, pas une API d'import.
- Toute évolution vers import officiel Airbnb/Booking, iCal ou réservation doit faire l'objet d'une spec dédiée.

---

## Date

2026-06-12

## Auteur

Product Owner
