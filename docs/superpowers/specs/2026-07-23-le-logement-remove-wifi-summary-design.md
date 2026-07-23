# Suppression du raccourci Wi-Fi redondant — Design

**Date :** 2026-07-23  
**Statut :** approuvé par le Product Owner

## Objectif

Supprimer la vignette Wi-Fi du récapitulatif supérieur de `/le-logement` afin de ne pas répéter une information déjà disponible plus bas.

## Rendu retenu

- Le récapitulatif supérieur affiche seulement `Arrivée — À partir de 16 h` et `Départ — 10 h`.
- La carte détaillée `Réseau Wi-Fi` de la section `Infos pratiques` reste inchangée.
- Le SSID, le mot de passe et les boutons de copie restent disponibles dans cette carte détaillée.
- Si aucune donnée Wi-Fi n'existe, la carte détaillée continue d'être omise comme aujourd'hui.

## Données et périmètre

- Aucun changement Prisma, API, formulaire Owner ou stockage.
- `wifi_ssid` et `wifi_password` restent sélectionnés par la requête de la page.
- Seul le `FactCard` Wi-Fi récapitulatif est retiré du JSX.

## Test

Le test d'intégration fournit un SSID et un mot de passe, vérifie l'absence d'une vignette récapitulative portant le libellé exact `Wi-Fi`, puis confirme la présence unique de la carte détaillée `Réseau Wi-Fi` et des deux valeurs de connexion.
