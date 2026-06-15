# ADR-010 — Gemini pour l'assistance editoriale blog

## Statut

`accepted`

---

## Contexte

`ADR-006` limite Gemini dans le contexte POI / Guide : decouverte controlee et descriptif, sans donnees geographiques mesurables ni donnees temps reel. `ADR-009` autorise ensuite Gemini pour l'assistance editoriale des fiches logement, dans un bounded context distinct et a partir de contenus fournis ou valides par l'Owner.

Le chantier `029-blog-editorial` ouvre un autre contexte : la redaction d'articles de blog par le Super-admin. Le blog sert le SEO/GEO de MyStay avec des contenus locaux, des conseils de sejour, des contenus hebergement, restaurants, activites et guides locaux. L'Admin doit pouvoir utiliser Gemini comme aide a la redaction, sans deleguer la publication ni la production de faits non verifies.

---

## Décision

Gemini peut etre utilise pour l'assistance editoriale du blog, uniquement dans le bounded context `blog`, et uniquement a partir :

1. d'un brief fourni par l'Admin ;
2. de faits verifies saisis par l'Admin ;
3. d'une City optionnelle deja presente dans MyStay ;
4. de donnees publiques et validees du Guide si elles sont explicitement injectees par le serveur.

Usages autorises :

1. proposer un titre, un excerpt, un plan et un corps d'article en Markdown ;
2. reformuler, structurer et clarifier un brouillon fourni par l'Admin ;
3. proposer `seo_title` et `seo_description` ;
4. adapter l'angle editorial a une City rattachee en utilisant uniquement des informations MyStay deja validees ;
5. suggerer des formulations plus utiles pour le SEO/GEO.

Usages interdits :

- publier automatiquement un article ;
- inventer des faits, adresses, prix, disponibilites, horaires, statistiques, coordonnees, distances, durees ou metriques geographiques ;
- produire des informations temps reel ;
- scraper des sources externes ;
- importer, generer ou telecharger des images ;
- traiter des donnees personnelles ou secrets ;
- remplacer le systeme de traduction `027-multilingual-content`.

Le resultat Gemini est toujours un `Blog Generation Draft`. Il doit etre valide avec Zod, relu par l'Admin, applique volontairement a l'article, puis publie par action Admin separee.

---

## Options considérées

### Option A — Blog manuel sans Gemini
- ✅ Risque faible d'hallucination
- ✅ Implementation plus simple
- ❌ Redaction plus lente
- ❌ Moins d'effet de levier SEO/GEO

### Option B — Assistance Gemini cadree pour le blog (retenu)
- ✅ Accelere la redaction sans automatiser la publication
- ✅ Respecte la separation des bounded contexts
- ✅ Garde l'Admin responsable des faits et de la publication
- ✅ Compatible avec les interdictions de `ADR-006`
- ✅ Permet de tracer brief, faits verifies, provider, date et suggestion

### Option C — Gemini redige et publie automatiquement
- ✅ Production tres rapide
- ❌ Risque d'hallucination
- ❌ Perte de controle editorial
- ❌ Contradiction avec les contraintes de validation humaine du projet

---

## Justification

Le blog est un contexte editorial distinct des POI et des logements. Il ne sert pas a acquerir des lieux, calculer des metriques ou publier des donnees transactionnelles. Gemini peut donc etre utile pour structurer et reformuler des contenus fournis par l'Admin, a condition que les faits restent controles par MyStay et qu'aucune publication automatique ne soit possible.

Cette decision reprend le principe de `ADR-009` : assistance editoriale oui, invention et automatisation non.

---

## Conséquences

- La spec `029-blog-editorial` peut utiliser Gemini comme provider de brouillon editorial.
- Chaque generation doit stocker le brief, les faits verifies, le hash source, le provider, le statut, la date et la suggestion.
- Le prompt Gemini doit interdire explicitement l'invention de faits et les demandes de donnees geographiques, temps reel ou transactionnelles.
- La reponse Gemini doit etre validee avec Zod avant sauvegarde.
- La suggestion ne peut jamais passer directement en `published`.
- Les photos restent televersees par l'Admin ; Gemini ne traite pas les images.
- Toute extension vers traduction, import externe, generation d'images ou publication automatique exige une spec/ADR dediee.

---

## Date

2026-06-15

## Auteur

Product Owner
