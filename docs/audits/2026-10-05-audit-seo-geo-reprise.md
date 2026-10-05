# Audit SEO technique, SEO local et GEO — MyStay — reprise de l'après-midi

**Date :** 5 octobre 2026, vers 14 h 40 UTC
**Référence :** audit du matin, `docs/audits/2026-10-05-audit-seo-geo.md`
**Périmètre :** dépôt `main` (commit `7468d387`, identique à `origin/main`) et production `https://www.mystay.city`
**Mode :** lecture seule. Même prompt, même méthode, mêmes 6 pages Lighthouse que le matin.

Comme dans le premier rapport, chaque constat précise sa source : **[Dépôt]**, **[Prod]** ou **[Hypothèse]**.

---

## 1. Synthèse

### Ce qui a changé depuis le matin

| Indicateur | Matin | Après-midi |
|---|---|---|
| Temps de réponse serveur moyen (54 URL du sitemap) | ≈ 6,5 s | **0,53 s** (max 1,21 s) |
| Premier affichage observé, Lighthouse mobile, 6 pages | 6,1 à 7,1 s | **0,9 à 2,7 s** |
| Poids de la fiche `/logements/les-hauts-de-saint-gervais` | 6 015 Ko, 14 préchargements d'images | **1 714 Ko**, 2 préchargements |
| Poids HTML d'une page catégorie | 173 Ko (payload de démo) | **69 Ko** |
| URL inconnue | 200 « Accès par lien » (soft 404) | **404 « Page introuvable »** |
| Pages légales | inexistantes | **publiées et dans le sitemap** |
| Titres avec marque répétée | 36 | **0** |
| Hiérarchie Hn des articles | H1 → H4 | **H1 → H2** (Lighthouse `heading-order` OK) |
| `aggregateRating` issu de Google | présent sur les fiches POI | **absent** |
| JSON-LD invalides ou propriétés invalides | `provider` sur les logements | **0** |
| Photos des POI | liens directs vers 18 sites tiers | **253 sur 259 copiées** et optimisées |
| Lien « Contacter » des fiches logement | cassé (page privée) | **2 modales publiques** |

### Les freins qui restent

1. **Une image de fond de 2,5 Mo charge sur l'accueil et les pages locales (N-2, élevée).** Le PNG `/marketing/guide-interior.png` (1 672 × 941 px) sert de fond de secours derrière chaque carte logement. Il est téléchargé alors que la vraie photo le recouvre, et représente à lui seul 70 % du poids de l'accueil (3,4 Mo).
2. **Le sitemap est périmé (N-1, moyenne).** Il liste encore `/journal/article-f7e6dcbc` et `/logements/appart-luxe-vue-mont-blanc-6-p`, qui redirigent depuis le renommage de leurs slugs.
3. **Les pages de Saint-Nicolas restent minces (C-09, élevée).** `/seminaires/saint-nicolas-de-veroce` fait toujours 369 mots génériques.
4. **L'identité de MyStay n'est rattachée à aucun profil externe (C-15 et GEO).** Il manque `sameAs` vers la fiche Google Business Profile ou des réseaux. C'est le principal signal d'entité encore absent.
5. **Restes d'accessibilité :** contrastes insuffisants (6 pages sur 6), listes de définitions mal formées et intitulés de boutons différents de leur texte visible (`label-content-name-mismatch`). Il s'y ajoute des cibles tactiles trop petites sur la fiche logement.

---

## 2. Notes

### Note SEO : 7,4 / 10 (matin : 5,0)

| Axe | Poids | Matin | Après-midi | Justification |
|---|---|---|---|---|
| Exploration et indexation | 20 % | 6 | 9 | Vrais 404, pages légales en ligne ; reste un sitemap périmé (N-1) et la chaîne `http://mystay.city` (C-05) |
| Performance serveur et web vitals | 20 % | 3 | 7,5 | Serveur en 0,5 s, premier affichage observé sous 2,7 s ; l'accueil reste lourd (N-2), sans données terrain |
| On-page (titles, Hn, alt) | 15 % | 6 | 8,5 | Double marque corrigée, Hn corrigés ; 3 alt en identifiant (N-3), titre générique de `/confier-mon-logement` |
| Contenu et intentions | 20 % | 5 | 5,5 | Encart « Derrière MyStay », slug d'article descriptif ; pages Saint-Nicolas toujours minces, fiches POI peu enrichies |
| SEO local et confiance | 15 % | 4 | 6 | Éditeur identifié et adresse dans les mentions légales, logements filtrés par commune ; pas de `sameAs` ni de fiche GBP reliée |
| Données structurées | 10 % | 6,5 | 8,5 | `@id` stables, `dateModified`, BreadcrumbList sur les articles, plus de propriété invalide ; pas de `sameAs` |

### Note de préparation GEO : 6,5 / 10 (matin : 4,7)

| Axe | Poids | Matin | Après-midi | Justification |
|---|---|---|---|---|
| Accès des robots et contenu dans le HTML | 20 % | 6 | 9 | Rendu serveur en 0,5 s, robots IA et de recherche reçoivent un 200 |
| Clarté de l'entité MyStay | 20 % | 5 | 7 | Éditeur nommé, adresse et contact publics, encart personnel ; pas de profils externes |
| Réponses factuelles et sourcées | 25 % | 5 | 5,5 | Articles toujours sourcés ; pages locales sans chiffres (délais, capacités, distances) |
| Expertise locale originale | 20 % | 4 | 5 | Présentation de David Devillers, crédits photo ; peu de contenu vécu sur les lieux |
| Signaux de confiance | 15 % | 3 | 6 | Pages légales, CGU, politique de confidentialité ; articles toujours signés par l'organisation, aucun avis publié |

**Limites :** ces notes mesurent une qualité observable et une *préparation*. Elles ne mesurent ni les positions, ni le trafic, ni l'indexation réelle (pas d'accès à Search Console), ni la visibilité réelle dans les moteurs IA (aucun test effectué dans ces moteurs).

---

## 3. Couverture et outils

| Élément | Couverture |
|---|---|
| Sitemap de production | **54/54 URL crawlées** (statut, title, description, canonical, robots, H1, JSON-LD, mots) |
| Cas limites | 19 URL : inconnues, privées, admin, redirections, slash final, paramètres, communes inactives, `llms.txt`, apex `http` |
| Lighthouse 12.8.2 | Mobile, throttling simulé, 6 pages, 05/10/2026 vers 14 h 41–14 h 43 UTC. Valeurs **observées** comparées à celles du matin. |
| Robots | Googlebot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot |
| Base (lecture seule) | Liens présents dans les articles publiés |
| Non disponible | Search Console, CrUX ou Speed Insights terrain, journaux Vercel, PageSpeed Insights (quota de l'API publique) |

**Écart dépôt/production :** aucun constaté. Le seul décalage observé est celui du sitemap (N-1), qui vient d'un cache et non du code.

---

## 4. Inventaire des URL

- **Sitemap :** 54 URL, contre 51 le matin. Les ajouts sont `/mentions-legales`, `/confidentialite` et `/cgu`.
  - 52 répondent en 200, avec un canonical sur elles-mêmes.
  - **2 redirigent en 308** vers des URL saines : `/journal/article-f7e6dcbc` → `/journal/restaurants-altitude-saint-nicolas-de-veroce` et `/logements/appart-luxe-vue-mont-blanc-6-p` → `/logements/appartement-vue-mont-blanc-6-p` (N-1).
- **Communes :** inchangées. Pages actives à Saint-Gervais et Saint-Nicolas. Les Contamines, Megève et Combloux sont préparées mais inactives, et renvoient 404 (décision PO).

**Cas limites [Prod] :**

| URL | Statut | Commentaire |
|---|---|---|
| `/page-inexistante-audit`, `/logements/inexistant`, `/decouvrir/ville-inexistante`, `/conciergerie/megeve`, `/llms.txt` | 404 | Titre « Page introuvable », `noindex` |
| `/sejour`, `/le-logement`, `/contact`, `/guide/<ville>/agenda` | 200 « Accès par lien », `noindex` | Routes privées, comportement attendu |
| `/guide/<ville>` | 308 → `/decouvrir/<ville>` | OK |
| `/admin` | 307 → `/auth/login` | OK |
| `/logements/`, `/seminaires/` | 308 sans slash | OK |
| `/semainaire` | **404** | Cible d'un lien cassé dans l'article séminaire (N-4) |
| `http://mystay.city/` | 308 → `https://mystay.city/` → 308 → www | Chaîne de 2 sauts (C-05, inchangé) |

---

## 5. Suivi des constats du matin

| ID | Constat | État | Preuve [Prod] |
|---|---|---|---|
| C-01 | Lien « Contacter » des fiches logement | **Corrigé** (et révisé : le guide n'était pas exposé) | Aucun `?lodging=` dans le HTML ; modales voyageur et propriétaire |
| C-02 | Temps de réponse ≈ 6,5 s | **Corrigé** | 0,53 s en moyenne ; démo retirée, région `dub1` |
| C-03 | Soft 404 global | **Corrigé** | URL inconnues en 404 |
| C-04 | Pages légales absentes | **Corrigé** | 3 pages en 200, dans le sitemap |
| C-05 | Chaîne de redirection `http` sur le domaine nu | **Ouvert** | 2 sauts (réglage Vercel) |
| C-06 | Double marque dans les titles | **Corrigé** | 0 occurrence |
| C-07 | Hn décalés | **Corrigé** | Articles H1 → H2, fiche logement H1 → H2 → H3 |
| C-08 | Alt en identifiant | **Presque corrigé** | 3 restants (N-3) |
| C-09 | Pages Saint-Nicolas minces | **Partiel** | Logements filtrés par commune ; contenu inchangé (369 mots pour le séminaire) |
| C-10 | Couverture communale | **Clos (décision PO)** | Seules les communes réellement actives sont ouvertes |
| C-11 | `aggregateRating` issu de Google | **Corrigé** | 0 occurrence |
| C-12 | Maillage vers les pages communales | **Non retenu (décision PO)** | Seuls les liens rédigés dans les articles (vers une page du site ou un logement) ; liens internes dans le même onglet |
| C-13 | Images non optimisées | **Corrigé**, mais un nouveau point (N-2) | Photos via l'optimiseur, POI copiées ; image de fond de 2,5 Mo |
| C-14 | Défauts éditoriaux | **Corrigé** | « Envie de séjourner au » absent, slugs renommés |
| C-15 | Compléments JSON-LD | **Presque corrigé** | `@id`, `dateModified` et `provider` traités ; `sameAs` manquant |
| C-16 | `/confier-mon-logement` faible | **Partiel** | Encart « Derrière MyStay » ; title « Confier mon logement » toujours générique |
| C-17 | Fiches POI peu enrichies | **Ouvert** | 170 à 230 mots, pas d'avis MyStay |

---

## 6. Nouveaux constats

### N-1 — Sitemap périmé — **Moyenne**
- **[Prod]** Le sitemap liste 2 URL qui redirigent (voir §4).
- **[Dépôt]** Le sitemap est mis en cache et revalidé par les actions de l'admin (`revalidatePath('/sitemap.xml')`). Le script de renommage `scripts/correct-editorial-c14.ts` modifie les slugs directement en base, sans revalidation.
- **Conséquence :** Google explore des URL qui redirigent ; c'est un signal de sitemap peu fiable, sans gravité à court terme.
- **Correction :**
  - revalider le sitemap : republier l'article et le logement concernés depuis l'admin, ou redéployer ;
  - à l'avenir, tout script qui modifie des slugs doit déclencher la revalidation.
- **Effort :** faible. **Confiance :** élevée. **Validation :** le sitemap ne contient plus que des URL en 200.

### N-2 — Image de fond de 2,5 Mo derrière les cartes logement — **Élevée**
- **[Prod]** Lighthouse, accueil : `/marketing/guide-interior.png` pèse 2 466 Ko sur 3 446 Ko au total.
- **[Dépôt]** Elle sert de fond CSS `bg-[url('/marketing/guide-interior.png')]` dans `MarketingPropertyCard.tsx:30` et `:61`, et dans `LocalRentalCard.tsx:19`. Ce fond ne passe pas par l'optimiseur et se télécharge même quand la photo du logement le recouvre.
- **Conséquence :** des mégaoctets inutiles sur mobile, sur l'accueil et les pages locations de vacances.
- **Correction :** retirer ce fond (la carte a déjà un fond gris clair), ou le remplacer par un WebP de quelques dizaines de Ko.
- **Effort :** faible. **Confiance :** élevée. **Validation :** poids de l'accueil sous 1,2 Mo dans Lighthouse.

### N-3 — 3 textes alternatifs en identifiant — **Faible**
- **[Prod]**
  - `/seminaires` et `/seminaires/saint-gervais-les-bains` : la carte du Chalet Rémy a pour alt `7ebc23c0 c767 4b3d …`.
  - `/logements/la-pieuca` : une photo a pour alt `fb5fc02e 72c4 … (1)`.
- **[Hypothèse]** Le texte de repli ajouté pour C-08 ne couvre pas la requête des logements de séminaire (`seminar-lodgings.ts`), et une photo de La pieuca a gardé un nom de fichier comme alt en base.
- **Correction :** appliquer le même texte de repli à la requête des séminaires et renseigner l'alt de la photo de La pieuca dans l'admin.

### N-4 — Lien interne cassé dans un article — **Faible**
- **[Base]** L'article « Organiser un séminaire de deux jours en montagne » contient un lien vers `https://www.mystay.city/semainaire`, qui renvoie un 404.
- **Correction :** remplacer par `/seminaires` dans l'admin du Journal.

### N-5 — Photos cassées à la source — **Faible**
- **[Prod]** Le Tremplin de la Croix : une photo Apidae est un JPEG tronqué. Le P'tit Traquenard (non publié) : 5 photos renvoient 403 ou 404.
- **Correction :** remplacer ou retirer ces photos dans l'admin. La détection des liens morts indique pourtant `ok` pour Le P'tit Traquenard ; c'est à vérifier.

---

## 7. Intentions de recherche et cannibalisation

La cartographie du matin reste valable (rapport principal, §7). Deux évolutions :
- **Restaurants de Saint-Nicolas :** l'article a maintenant un slug descriptif (`restaurants-altitude-saint-nicolas-de-veroce`), ce qui clarifie son intention face à `/decouvrir/saint-nicolas-de-veroce/diner`.
- **Séminaires : le risque principal demeure.** `/seminaires` et `/seminaires/saint-gervais-les-bains` partagent la même offre (le Chalet Rémy), avec 24 % de texte commun.

---

## 8. Exemples de corrections

**N-2, carte logement :**

```tsx
// Avant : fond de 2,5 Mo téléchargé derrière chaque carte
<div className="relative aspect-[4/3] overflow-hidden bg-slate-100 bg-[url('/marketing/guide-interior.png')] bg-cover bg-center">
// Après : fond neutre, la photo du logement passe déjà par next/image
<div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
```

**C-16, title de `/confier-mon-logement` :** « Confier son logement à une conciergerie au Pays du Mont-Blanc | MyStay ».

**C-15, `sameAs`** à ajouter dès que les URL réelles sont connues :

```json
"sameAs": ["<URL de la fiche Google Business Profile>", "<LinkedIn ou Instagram s'ils existent>"]
```

---

## 9. GEO

- **Accès :** tous les robots testés reçoivent un 200, et le contenu est dans le HTML initial, servi en 0,5 s. Le risque de délai dépassé chez les robots qui consultent les pages à la demande est levé [Hypothèse fondée sur la mesure].
- **Entité :**
  - acquis : l'éditeur est nommé (David Devillers), son adresse et ses moyens de contact sont publics, et un encart de présentation existe ;
  - manquant : le lien vers des profils externes (`sameAs`, fiche Google), qui permet aux moteurs de rattacher MyStay à une entité connue.
- **Réponses factuelles :** les pages locales n'ont toujours ni délais, ni capacités, ni distances. C'est le principal levier de contenu restant.
- **`llms.txt` :** toujours absent (404). Priorité très faible, sans effet démontré.
- **Tests dans les moteurs IA :** non réalisés. Le protocole du rapport principal (§9.3) s'applique.

---

## 10. Plan d'action

**Immédiat :**
1. N-2 : retirer l'image de fond de 2,5 Mo.
2. N-1 : revalider le sitemap (republication ou redéploiement).
3. N-4 : corriger le lien `/semainaire`.
4. N-3 : ajouter le texte de repli aux logements de séminaire et corriger l'alt de La pieuca.

**Sous 30 jours :**
- C-15 : ajouter `sameAs` (fiche Google Business Profile, réseaux) ;
- C-16 : title de `/confier-mon-logement` ;
- C-05 : redirection directe du domaine nu `http` vers `https://www` ;
- accessibilité : contrastes, structure des listes de définitions, intitulés des boutons, taille des cibles tactiles.

**Sous 90 jours :**
- C-09 : contenu propre pour les pages de Saint-Nicolas, ou dépublier la page séminaire ;
- C-17 : avis MyStay sur les fiches POI ;
- Les Contamines-Montjoie si l'activité le justifie ;
- premier cycle du protocole GEO.

---

## 11. Données toujours manquantes

- **Search Console :** indexation réelle, effet des corrections sur les impressions, soft 404 résiduels.
- **Données terrain :** Vercel Speed Insights ou CrUX, pour confirmer en conditions réelles des gains mesurés en laboratoire.
- **URL réelles :** fiche Google Business Profile et réseaux sociaux, pour `sameAs`.

---

## 12. Checklist après corrections

- [ ] Sitemap : 100 % des URL en 200, sans redirection.
- [ ] Accueil sous 1,2 Mo (Lighthouse, mobile).
- [ ] Aucun alt de type identifiant sur l'ensemble du sitemap.
- [ ] Aucun lien interne en 404 dans les articles publiés.
- [ ] `sameAs` présent et pointant vers des profils réels.
- [ ] `http://mystay.city/` redirige en un seul saut.

---

## 13. Les dix actions les plus utiles maintenant

1. Retirer l'image de fond de 2,5 Mo des cartes logement → N-2.
2. Revalider le sitemap et faire déclencher la revalidation par les scripts qui modifient des slugs → N-1.
3. Ajouter `sameAs` vers la fiche Google Business Profile et les réseaux réels → C-15.
4. Écrire un contenu local réel pour les pages de Saint-Nicolas, ou dépublier la page séminaire → C-09.
5. Corriger le lien cassé `/semainaire` → N-4.
6. Rendre le title de `/confier-mon-logement` descriptif → C-16.
7. Corriger les 3 alt restants → N-3.
8. Traiter les contrastes et les intitulés de boutons signalés par Lighthouse → accessibilité.
9. Enrichir les fiches POI d'un avis MyStay vécu → C-17.
10. Ouvrir Search Console et Speed Insights terrain pour mesurer l'effet réel de la journée → §11.
