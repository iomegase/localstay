# Spec — 081 Sauvegarde locale quotidienne

## Metadata

```yaml
id: 081-local-daily-backup
title: "Sauvegarder chaque jour la base Supabase et les fichiers du stockage sur le Mac du PO"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on: []
bounded_context: ops
implementation_gate: "PO 2026-10-06 : « mettre en place un back up en local avec une tâche cron journalière » ; choix : base + photos, 30 jours, ~/Backups/mystay."
```

## Context

Le 2026-10-06, la base de production (plan Supabase gratuit, sans sauvegarde) a été effacée.
Le PO veut une copie locale quotidienne, sans dépendre de Supabase.

## User Stories

### US-01 — Sauvegarde quotidienne

- **AC-01-01**: Given la tâche planifiée (launchd, 03:00, rattrapée au réveil du Mac), When elle
  s'exécute, Then un dump Postgres compressé (`pg_dump -Fc`, schémas `public`, `auth`,
  `storage`) est écrit dans `~/Backups/mystay/db/mystay-AAAA-MM-JJ-HHMM.dump` puis vérifié
  (`pg_restore --list`).
- **AC-01-02**: Given les buckets Supabase Storage, When la tâche s'exécute, Then les fichiers
  nouveaux ou modifiés sont copiés dans `~/Backups/mystay/storage/<bucket>/<chemin>` ; les
  fichiers inchangés ne sont pas retéléchargés ; un fichier supprimé côté Supabase est conservé
  localement.
- **AC-01-03**: Given les dumps de plus de 30 jours, When la tâche s'exécute, Then ils sont
  supprimés ; le dump le plus récent n'est jamais supprimé.
- **AC-01-04**: Given un échec (réseau, pg_dump, archive invalide), When il survient, Then il
  est journalisé (`~/Backups/mystay/logs/`) et une notification macOS est affichée.

### US-02 — Installation et restauration

- **AC-02-01**: Given le script d'installation, When le PO le lance, Then l'agent launchd est
  créé et chargé ; `--uninstall` le retire.
- **AC-02-02**: Given la documentation `docs/backup.md`, When le PO doit restaurer, Then la
  procédure (vérification dans une base locale d'abord, puis restauration) est décrite.

## Business Rules

- **BR-01**: Lecture seule côté Supabase : aucune commande destructive, jamais de base fantôme.
- **BR-02**: Les sauvegardes restent hors du dépôt git (données personnelles).
- **BR-03**: Les identifiants sont lus depuis `.env.local` du projet, jamais copiés ailleurs.
- **BR-06** (révision 2026-10-08, incident des 7 et 8 octobre) : à 3 h le Mac en veille lance la tâche
  pendant un réveil de maintenance sans réseau ; la sauvegarde attend donc que la base et Supabase
  soient joignables (vérification toutes les 30 s, jusqu'à 60 min, `MYSTAY_BACKUP_NETWORK_WAIT_MIN`) avant
  de commencer, puis échoue avec notification si le réseau ne revient pas.
- **BR-07** (PO 2026-10-08 : « le Mac est toujours en veille à 3 h ») : une sauvegarde toutes les heures
  de 9 h à 22 h (launchd) ; en dehors du créneau 9 h – 23 h (rattrapage au réveil) la tâche s'arrête sans
  rien faire. `backup.sh --force` sauvegarde immédiatement. Rétention inchangée (30 jours).

## Data Model / API Contract

Aucun changement.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..04 | Dump vérifié, copie incrémentale, rétention, échec signalé | unit + exécution manuelle |
| AC-02-01..02 | Installation launchd, procédure de restauration | exécution manuelle |

## Out of Scope

- Sauvegarde hors du Mac (cloud) ; restauration automatique.

## Open Questions

Aucune.
