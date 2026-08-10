# Consignes fixes du logement — Design

## Contexte

Les consignes de sortie et le règlement intérieur sont désormais identiques pour
tous les logements MyStay. Ils ne relèvent plus de la personnalisation Owner et
ne doivent plus dépendre de valeurs Supabase.

## Source de vérité

Un module partagé expose deux tableaux immuables.

### Consignes de sortie

1. Déposer vos déchets au point de recyclage indiqué ci-dessous.
2. Faire la vaisselle ou lancer le lave-vaisselle avant votre départ.
3. Rassembler le linge de toilette utilisé dans la salle de bain.
4. Laisser les draps en place sur les lits.
5. Remettre les meubles, chaises et objets déplacés à leur emplacement d'origine.
6. Fermer les fenêtres et les Velux.
7. Éteindre les lumières ainsi que les appareils électriques inutiles.
8. Ne pas éteindre le chauffage.
9. Vérifier que vous n'avez rien oublié dans le logement.

### Règlement intérieur

1. Merci de respecter le logement, son mobilier ainsi que le voisinage pendant toute la durée de votre séjour.
2. Les fêtes et nuisances sonores, notamment entre 22 h et 8 h, ne sont pas autorisées.
3. Merci d'utiliser les équipements conformément à leur destination et de nous signaler rapidement tout incident ou dommage.

La ponctuation finale est normalisée avec un point pour chaque phrase.

## Intégration

- Le guide privé reçoit toujours ces tableaux depuis l'adaptateur
  `getPrivateGuideData`, indépendamment des anciennes valeurs
  `checkout_instructions` et `house_rules`.
- Le guide démo importe les mêmes constantes afin d'éviter toute divergence.
- La page privée historique `/le-logement` utilise la liste fixe des consignes
  de sortie tant qu'elle reste accessible.
- Les champs « Consignes de départ » et « Règlement intérieur » sont retirés du
  formulaire de personnalisation Owner.
- Les colonnes et anciennes valeurs restent en base pour compatibilité et ne
  sont ni migrées ni supprimées. Elles ne pilotent plus l'affichage.

## Interface et état

La checklist conserve son fonctionnement actuel : compteur, progression et
cases cochées uniquement en mémoire locale. Le règlement reste affiché dans la
vue « Équipements ». Aucune nouvelle API et aucun nouvel état d'erreur ne sont
introduits.

## Tests

Les tests vérifient que :

- les deux tableaux correspondent exactement aux textes validés ;
- l'adaptateur privé ignore des valeurs Supabase contradictoires ;
- la démo et la page historique consomment la source partagée ;
- le formulaire Owner n'affiche plus les deux champs ;
- la checklist et le règlement continuent de se rendre normalement.

