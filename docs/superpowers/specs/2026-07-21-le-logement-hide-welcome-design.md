# Masquage du message de bienvenue sur `/le-logement` — Design

**Date :** 2026-07-21  
**Statut :** approuvé par le Product Owner

## Objectif

Ne plus afficher de message de bienvenue sur la page `/le-logement`, sans supprimer ni modifier la donnée enregistrée dans `LodgingCustomization.welcome_message`.

## Rendu retenu

- Retirer la salutation statique `Bienvenue chez vous ♡` du hero.
- Retirer la carte qui affiche le `welcome_message` personnalisé.
- Conserver l'entrée de menu `Bienvenue`, l'ancre `#bienvenue`, le titre `Votre séjour commence ici` et les trois raccourcis vers les autres sections.
- Ne rendre aucun texte de remplacement.

## Données et périmètre

- La requête Prisma peut continuer à sélectionner `welcome_message` afin de ne pas modifier le contrat backend dans ce changement front-only.
- Le champ, l'API, le formulaire Owner et les autres pages qui affichent ce message restent inchangés.
- Aucun changement de schéma Prisma ni migration.

## Test

Le test d'intégration fournit volontairement un `welcome_message`, vérifie que son texte et la salutation statique sont absents du document, puis confirme que la section `Bienvenue` et ses trois raccourcis sont toujours rendus.
