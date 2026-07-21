# Refonte de `/le-logement` d'après la référence MyStay — Design

**Date :** 2026-07-21  
**Statut :** approuvé par le Product Owner  
**Référence :** `https://mystay-logement-refonte.dawoud74.chatgpt.site/`

## Objectif

Remplacer le carrousel actuel de `/le-logement` par une page verticale fidèle à la référence fournie, sans modifier le backend, les autres pages publiques, le header global ni la barre de navigation inférieure.

## Périmètre validé

- La refonte est strictement limitée à `/le-logement`.
- Le bouton menu de cette route ouvre un tiroir `Guide du logement` propre à la page.
- Le menu global reste inchangé partout ailleurs.
- Les quatre destinations sont `Bienvenue`, `Infos pratiques`, `Bon à savoir` et `Départ`.
- Les horaires sont constants : arrivée à partir de 16 h et départ à 10 h.
- Les couleurs deviennent plus joyeuses sur cette page seulement.
- Aucun champ Prisma, endpoint ou formulaire Owner n'est ajouté.

## Architecture retenue

La page demeure un Server Component responsable des requêtes Prisma et de la composition des données. Les interactions isolées — menu contextuel, navigation sticky, copie du Wi-Fi et checklist locale — sont portées par de petits Client Components. Le composant global `PublicMenu` détecte la route `/le-logement` et rend le tiroir contextuel uniquement sur cette route ; son comportement actuel reste inchangé ailleurs.

Le `LodgingPager` n'est plus utilisé par la page. Le contenu devient un flux vertical sémantique composé de quatre sections avec identifiants stables. Le menu et la barre sticky ciblent ces identifiants par ancres et ferment le tiroir avant le déplacement.

## Structure visuelle

### Hero

- Grande photo de couverture arrondie lorsque disponible.
- Carte éditoriale avec badge `Votre guide de séjour`, nom du logement, City, message d'accueil et bouton d'itinéraire conditionnel.
- Photo absente : la carte éditoriale occupe seule l'espace sans image fictive.

### Repères rapides

- `Arrivée` : `À partir de 16 h`.
- `Départ` : `10 h`.
- `Wi-Fi` : affiché uniquement si un SSID ou un mot de passe existe, avec l'interaction de copie existante.

### Navigation de section

- Barre sticky horizontale et accessible.
- L'élément actif suit la section visible.
- Les boutons déclenchent un scroll doux, désactivé si l'utilisateur préfère réduire les animations.

### Sections

1. `Bienvenue` : message Owner et raccourcis vers les sections utiles.
2. `Infos pratiques` : bento cards pour adresse, vidéo, parking, Wi-Fi, règlement, services et urgences.
3. `Bon à savoir` : équipements et blocs personnalisés Owner, rendus en cartes ou accordéons selon la densité du contenu.
4. `Départ` : consignes, checklist locale quand le texte contient une liste, poubelles et itinéraire vers leur emplacement.

Les contenus absents sont omis. Aucun texte métier, horaire spécifique ou média n'est inventé.

## Palette et responsive

- Fond général gris bleuté très clair.
- Bleu vif pour les actions principales et la navigation active.
- Jaune chaleureux pour parking et informations d'arrivée.
- Vert pour équipements et tri des déchets.
- Rose/corail pour urgences ou repères ponctuels.
- Texte principal bleu nuit et contraste accessible.
- Mobile : une colonne, tiroir plein écran, barre sticky défilable.
- Desktop : hero en deux colonnes et bento grid multi-colonnes, dans la coque publique existante.

## Menu mobile propre à `/le-logement`

Le tiroir reprend le contrat visible dans la référence : marque `MYSTAY`, bouton fermer, surtitre `Guide du logement`, quatre lignes avec icône et séparateurs. Il est rendu dans un portal au-dessus de la page. Chaque lien ferme le tiroir puis atteint l'ancre correspondante. La gestion clavier comprend focus visible, touche Échap et libellés accessibles.

## Données et états

- Les deux requêtes Prisma actuelles sont conservées.
- Les horaires sont des constantes de présentation.
- La checklist est éphémère et remise à zéro au rechargement.
- L'état vide global reste disponible si aucune personnalisation n'existe.
- Une section partiellement vide reste lisible et ne réserve pas de grille fantôme.

## Tests

- Test unitaire du menu contextuel sur `/le-logement` et non-régression du menu global sur les autres routes.
- Test unitaire de la navigation d'ancrage et de la fermeture du tiroir.
- Test d'intégration de la structure verticale, des horaires constants et du mapping des contenus.
- Test d'intégration des omissions lorsque les données facultatives sont absentes.
- Test de la checklist locale sans persistance.
- Vérification ciblée Jest, lint, build puis contrôle visuel mobile de la route locale.

## Hors périmètre

- Modification du header global ou de `PublicBottomNav`.
- Modification d'une autre route.
- Ajout de champs d'heure en base.
- Sauvegarde de la checklist.
- Refonte du dashboard Owner.
